import datetime
from app import app
from app.cloudstack.cloudstack_base_resource import CloudstackResource
from app.usage_record.measure import MeasureClient
from dateutil.parser import parse


class UsageRecordReader:

    USAGE_TYPES = {1: 'Running VM', 2: 'Allocated VM', 6: 'Volume', 9: 'Volume Snapshot'}

    def __init__(self, region):
        self.region = region
        self.acs = CloudstackResource().get_cloudstack(region)
        self.measure = MeasureClient()

    def index_usage(self, date=None):
        if date is None:
            date = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()

        self.log("Starting usage processing. Date: " + date)

        try:
            self.delete_records(date)

            params = dict()
            params['startdate'] = date
            params['enddate'] = date
            params['pagesize'] = app.config['USAGE_API_BATCH_SIZE']
            record_count = 0

            projects = self.get_projects()

            for usage_type_id, usage_type in self.USAGE_TYPES.iteritems():
                self.log("Processing usage records by type: " + usage_type)
                params['page'] = '1'
                params['type'] = str(usage_type_id)

                records = self.acs.listUsageRecords(params).get('usagerecord')

                while records is not None and len(records) > 0:
                    self.log("Processing  %s usage records " % len(records))

                    for r in records:
                        if r.get('projectid') is not None:
                            project = next((x for x in projects if x.get('id') == r.get('projectid')), dict())
                            account = project.get('account')
                            self.measure.create(self.build_usage_record(r, account, usage_type))

                    params['page'] = str(int(params['page']) + 1)
                    record_count += len(records)
                    records = self.acs.listUsageRecords(params).get('usagerecord')

            self.log("Execution ended %s records processed." % record_count)
        except:
            self.log("Error reading usage data. Date: " + date)
            self.rollback(date)

    def build_usage_record(self, r, account, usage_type):
        usage_record = dict()
        usage_record['rawusage'] = float(r.get('rawusage'))
        usage_record['offeringid'] = r.get('offeringid', '-')
        usage_record['projectid'] = r['projectid']
        usage_record['usagetype'] = usage_type
        usage_record['date'] = parse(r['startdate']).date().isoformat()
        usage_record['account'] = account
        usage_record['region'] = self.region
        return usage_record

    def log(self, message, level='info'):
        getattr(app.logger, level)(('[%s] ' % self.region.upper()) + message)

    def rollback(self, date):
        self.log("Rolling back operation Date: " + date)
        self.delete_records(date)

    def delete_records(self, date):
        self.measure.delete(self.region, date)

    def get_projects(self):
        return self.acs.listProjects({'simple': 'true', 'listall': 'true'}).get('project')
