from flask import request
from flask_restful import reqparse
from app.auth.utils import required_login
from app.cloudstack.cloudstack_base_resource import CloudstackResource, handle_errors
import app
import re


class VirtualMachineResource(CloudstackResource):

    # TODO: add OS type to vm attributes
    @required_login
    @handle_errors
    def get(self, region):
        self._validate_params()
        response = self.get_cloudstack(region).listVirtualMachines(self._filter_by())

        if response.get('errortext') is not None:
            app.logger.error("Error while retrieving data from cloudstack: %s" % response['errortext'])
            return {"message": response['errortext']}, 400

        return self._to_json(response)

    def _validate_params(self):
        parser = reqparse.RequestParser()
        parser.add_argument('page_size', type=int, help='page_size should be an integer')
        parser.add_argument('page', type=int, help='page should be an integer')
        self.args = parser.parse_args(req=request)

    def _filter_by(self):
        params = {"listall": "true", "simple": "true"}
        if request.args.get('project_id') is not None:
            params['projectid'] = request.args['project_id']

        if request.args.get('zone_id') is not None:
            params['zoneid'] = request.args['zone_id']

        if request.args.get('host_id') is not None:
            params['hostid'] = request.args['host_id']

        if request.args.get('service_offering_id') is not None:
            params['serviceofferingid'] = request.args['service_offering_id']

        if request.args.get('state') is not None:
            params['state'] = request.args['state']

        params.update(filter_by_tag())

        params['pagesize'] = request.args.get('page_size', "10")
        params['page'] = request.args.get('page', "1")

        return params

    def _to_json(self, response):
        json = {}
        if response is not None and response.get('count') is not None:
            json["count"] = response["count"]
            json["virtual_machines"] = [
                {
                    "id": vm["id"],
                    "name": vm["name"],
                    "state": vm["state"],
                    "instance_name": vm["instancename"],
                    "zone_name": vm["zonename"],
                    "zone_id": vm["zoneid"],
                    "host_name": vm.get("hostname", None),
                    "host_id": vm.get("hostid", None),
                    "service_offering_name": vm["serviceofferingname"],
                    "service_offering_id": vm["serviceofferingid"],
                    "ha_enabled": vm["haenable"]
                }
                for vm in response['virtualmachine']
            ]
        else:
            json["count"] = 0
            json["virtual_machines"] = []
        return json


class VmCountResource(CloudstackResource):

    FEATURE_NAMES = ['state', 'serviceofferingname', 'hostname', 'zonename', 'haenable']

    @required_login
    @handle_errors
    def get(self, region):
        self._validate_params()
        params = {"listall": "true", "projectid": self.args['project_id']}
        params.update(filter_by_tag())

        response = self.get_cloudstack(region).listVirtualMachines(params)

        vm_count = {}
        for vm in response["virtualmachine"]:
            for ft_name in self.FEATURE_NAMES:
                vm_count[ft_name] = vm_count.get(ft_name, {})
                ft_value = vm.get(ft_name)
                if ft_value is not None:
                    vm_count[ft_name][ft_value] = (vm_count[ft_name].get(ft_value, 0) + 1)

        return vm_count

    def _validate_params(self):
        parser = reqparse.RequestParser()
        parser.add_argument('project_id', required=True, type=str, help='project_id must be informed')
        self.args = parser.parse_args(req=request)


def filter_by_tag():
    params = {}
    tag_parameter_regex = re.compile('tags\[\d\]\..*')
    for key in request.args.keys():
        if tag_parameter_regex.match(key):
            params[key] = request.args[key]
    return params