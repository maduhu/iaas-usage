describe('Testing Region controller', function() {

    var rootScope, ctrl;
    var regionServiceMock;
    var region1 = {key: 'r1', value: 'region1'}
    var region2 = {key: 'r2', value: 'region2'}

    var regions = [region1, region2]

    beforeEach(function (done){
        module('iaasusage');
        regionServiceMock = jasmine.createSpyObj('regionService', ['listRegions', 'getCurrentRegion', 'reloadWithRegion']);

        inject(function($rootScope, $controller) {
            $scope = $rootScope.$new();
            rootScope = $rootScope

            regionServiceMock.listRegions.and.returnValue(regions);
            regionServiceMock.getCurrentRegion.and.returnValue(region1);
            regionServiceMock.reloadWithRegion.and.returnValue(null);

            ctrl = $controller('RegionCtrl', {
                $scope: $scope,
                $rootScope: $rootScope,
                regionService: regionServiceMock
            });
        });

        window.jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
        return setTimeout((function() { return done(); }), 500);
    });

    it('should have list of regions and current region populated on controller scope', function() {
        expect(ctrl.regionList).toEqual(regions)
        expect(ctrl.currentRegion).toEqual(region1)
    });

    it('should return the list of regions', function() {
        expect(ctrl.listRegions()).toEqual(regions)
    });

    it('should return the current region', function() {
        expect(ctrl.getCurrentRegion()).toEqual(region1)
    });

    it('should change the current region', function() {
        ctrl.changeRegion(region2)
        expect(regionServiceMock.getCurrentRegion).toHaveBeenCalled();
        expect(regionServiceMock.reloadWithRegion).toHaveBeenCalled();
    });

    it('should change selector when toggleSelector is called', function() {
        expect(ctrl.selectorClass).toBeUndefined()
        ctrl.toggleSelector()
        expect(ctrl.selectorClass).toEqual('sidebar-open')
        ctrl.toggleSelector()
        expect(ctrl.selectorClass).toBeUndefined()
    });
});

describe('Testing User controller', function() {

    var rootScope, $scope, ctrl, httpBackend, state;
    var user = {"id": "1", "username": "user"}

    beforeEach(function (done){
        module('iaasusage');

        userServiceMock = jasmine.createSpyObj('userService', ['getCurrentUser']);

        inject(function($rootScope, $controller) {
            $scope = $rootScope.$new();

            userServiceMock.getCurrentUser.and.callFake(function(callback){
                callback(user);
            });

            ctrl = $controller('UserCtrl', {
                $scope: $scope,
                userService: userServiceMock
            });
        });

        window.jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
        return setTimeout((function() { return done(); }), 500);
    });

    it('should load current logged user from server', function() {
        ctrl.loadUser()

        expect(ctrl.user).toEqual(user)
        expect(userServiceMock.getCurrentUser).toHaveBeenCalled()
    });
});

describe('Testing Project controller', function() {

    var projects = [{"id":1, "name": "name","vm_count":1, "account": "account"}]
    var user = {"username": "user", "account_name": "acc", "domain_id": 1, "is_admin": false}
    var ctrl, httpBackend, $scope

    beforeEach(function (done){
        module('iaasusage');

        apiServiceMock = jasmine.createSpyObj('apiService', ['buildAPIUrl']);
        userServiceMock = jasmine.createSpyObj('userService', ['getCurrentUser']);

        inject(function($rootScope, $controller, $http, $httpBackend, $state) {
            $scope = $rootScope.$new();
            httpBackend = $httpBackend
            $state.current.data = {context: 'Projects', link: 'link'}

            userServiceMock.getCurrentUser.and.callFake(function(callback){
                callback(user);
            });
            apiServiceMock.buildAPIUrl.and.returnValue('/project/');

            $httpBackend.when('GET', '/api/v1/region/').respond([{key: 'cme', value: 'RJCME'}]);
            $httpBackend.when('GET', '/project/').respond(projects);
            httpBackend.expectGET('/api/v1/region/');

            ctrl = $controller('ProjectCtrl', {
                $scope: $scope,
                $http: $http,
                $state: $state,
                apiService: apiServiceMock,
                userService: userServiceMock,
                DTOptionsBuilder: {
                    newOptions: function(){
                        return{
                            withOption: function(){
                             return {
                                    withOption:function(){}
                                }
                            }
                        }
                    }
                }
            });
        });

        window.jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
        return setTimeout((function() { return done(); }), 500);
    });

    it('should return the list of projects', function() {
        ctrl.listProjects(null, user)
        httpBackend.expectGET('/project/');
        httpBackend.flush();
        expect(ctrl.projects).not.toBeUndefined()
        expect(userServiceMock.getCurrentUser).toHaveBeenCalled()
    });
});

describe('Testing Instance controller', function() {

    var ctrl, httpBackend, $scope

    var instances = {
        summary:{ zonename:{ 'a': 1, 'b': 1 } },
        vms:{ count: 2, virtual_machines: [{"id": 1, "zonename" : 'a'},{"id": 1, "zonename" : 'b'}] }
    }

    beforeEach(function (done){
        module('iaasusage');

        apiServiceMock = jasmine.createSpyObj('apiService', ['buildAPIUrl']);
        tagServiceMock = jasmine.createSpyObj('tagService', ['buildTagParams']);
        listFilterServiceMock = jasmine.createSpyObj('listFilterService', ['filter']);

        inject(function($rootScope, $controller, $http, $httpBackend) {
            $scope = $rootScope.$new();
            httpBackend = $httpBackend

            apiServiceMock.buildAPIUrl.and.returnValue('/instance/');
            $httpBackend.when('GET', '/api/v1/region/').respond([{key: 'cme', value: 'RJCME'}]);
            $httpBackend.when('GET', '/instance/').respond(instances);
            httpBackend.expectGET('/api/v1/region/');

            ctrl = $controller('InstanceCtrl', {
                $scope: $scope,
                $http: $http,
                apiService: apiServiceMock,
                tagService: tagServiceMock,
                listFilterService: listFilterServiceMock,
                DTOptionsBuilder: {
                    newOptions: function(){
                        return {
                            withDOM: function(){
                                return {
                                    withOption: function(){
                                        return {
                                            withButtons:function(){}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
        });

        window.jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
        return setTimeout((function() { return done(); }), 500);
    });

    it('should have controller scoped objects set up', function() {
        expect(ctrl.title).toEqual('Instances')
        expect(ctrl.projectName).toEqual('')
        expect(ctrl.vmCount).toBeUndefined()
        expect(ctrl.instances).toEqual([])
        expect(ctrl.instanceView).toEqual([])
        expect(ctrl.filters).toEqual({})
        expect(ctrl.tags).toEqual([])
    });

    it('should filters be cleared', function() {
        ctrl.filter('Zone', "zone_id", 2)
        ctrl.clearFilters()
        expect(ctrl.filters).toEqual({})
    });

    it("should filter be removed if set twice", function(){
        ctrl.filter('Zone', "zone_id", 1)
        ctrl.filter('Zone', "zone_id", 1)
        expect(ctrl.isFilteredField("zone_id", 1)).toBe(false)
    })

    it("should fetch the list of instances from the server", function(){
        ctrl.listVirtualMachines()
        httpBackend.expectGET('/instance/');
        httpBackend.flush();

        expect(ctrl.getInstances().length).toEqual(2)
        expect(ctrl.vmCount).not.toBeUndefined()
    })

    it("should tag filters be added and others filters be cleared", function(){
        ctrl.listVirtualMachines()
        ctrl.filter('Zone', "zone_id", 2)
        httpBackend.flush();

        ctrl.filterByTag('key', 'value')

        expect(ctrl.tags).toEqual([{key: 'key', value: 'value'}])
        expect(ctrl.filters).toEqual({})
    })

    it("should tag be removed from filters", function(){
        ctrl.filterByTag('key', 'value')
        ctrl.filterByTag('key2', 'value2')

        ctrl.removeTagFilter('key2', 'value2')
        expect(ctrl.tags).toEqual([{key: 'key', value: 'value'}])
    })
});

describe('Testing Storage controller', function() {

    var ctrl, httpBackend, $scope
    var storage = {storage: [{
        "name": 'ROOT-3145', "state": 'Ready',"size": '1287589', "zone_name": 'zone', 'zone_id': 1,
        "created": "2015-09-18T14:08:30-0300", "type": 'ROOT', 'attached': true}
    ]}

    beforeEach(function (done){
        module('iaasusage');

        apiServiceMock = jasmine.createSpyObj('apiService', ['buildAPIUrl']);
        tagServiceMock = jasmine.createSpyObj('tagService', ['buildTagParams']);
        resourceLimitServiceMock = jasmine.createSpyObj('resourceLimitService', ['']);
        listFilterServiceMock = jasmine.createSpyObj('listFilterService', ['filter']);

        inject(function($rootScope, $controller, $http, $httpBackend, $stateParams, $filter) {
            $scope = $rootScope.$new();
            httpBackend = $httpBackend

            apiServiceMock.buildAPIUrl.and.returnValue('/storage/');
            $httpBackend.when('GET', '/api/v1/region/').respond([{key: 'cme', value: 'RJCME'}]);
            $httpBackend.when('GET', '/storage/').respond(storage);
            httpBackend.expectGET('/api/v1/region/');


            ctrl = $controller('StorageCtrl', {
                $scope: $scope,
                $http: $http,
                $stateParams: $stateParams,
                $filter: $filter,
                apiService: apiServiceMock,
                tagService: tagServiceMock,
                resourceLimitService: resourceLimitServiceMock,
                listFilterService: listFilterServiceMock,
                DTOptionsBuilder: {
                    newOptions: function(){
                        return {
                            withDOM: function(){
                                return {
                                    withOption: function(){
                                        return {
                                            withButtons:function(){}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
        });

        window.jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
        return setTimeout((function() { return done(); }), 500);
    });

    it('should have controller scoped objects set up', function() {
        expect(ctrl.title).toEqual('Storage')
        expect(ctrl.projectName).toEqual('')
        expect(ctrl.storage).toEqual([])
        expect(ctrl.tags).toEqual([])
    });

    it("should fetch the list of storage from the server", function(){
        ctrl.listStorage()
        httpBackend.expectGET('/storage/');
        httpBackend.flush();

        expect(ctrl.storage.length).toEqual(1)
    })

    it("should tag filters be added", function(){
        ctrl.filterByTag('key', 'value')
        expect(ctrl.tags).toEqual([{key: 'key', value: 'value'}])
    })

    it("should tag be removed from filters", function(){
        ctrl.filterByTag('key', 'value')
        ctrl.filterByTag('key2', 'value2')

        ctrl.removeTagFilter('key2', 'value2')
        expect(ctrl.tags).toEqual([{key: 'key', value: 'value'}])
    })
});


describe('Testing Usage controller', function() {

    var ctrl, httpBackend, $scope
    var records = {"usage": [{ account: "db", domain: "ROOT", type: "Volume", usage: 15432 }]}
    var user = {is_admin: true, account_name: 'account'}

    beforeEach(function (done){
        module('iaasusage');

        apiServiceMock = jasmine.createSpyObj('apiService', ['buildAPIUrl']);
        userServiceMock = jasmine.createSpyObj('userService', ['getCurrentUser']);

        inject(function($rootScope, $controller, $http, $httpBackend, $stateParams, $filter, apiService) {
            $scope = $rootScope.$new();
            httpBackend = $httpBackend

            apiServiceMock.buildAPIUrl.and.returnValue('/usage_record/');
            userServiceMock.getCurrentUser.and.callFake(function(callback){
                callback(user);
            });


            $httpBackend.when('GET', '/api/v1/region/').respond([{key: 'cme', value: 'RJCME'}]);
            $httpBackend.when('GET', '/usage_record/').respond(records);
            httpBackend.expectGET('/api/v1/region/');

            ctrl = $controller('UsageCtrl', {
                $scope: $scope,
                $http: $http,
                $stateParams: $stateParams,
                $filter: $filter,
                userService: userServiceMock,
                apiService: apiServiceMock,
                DTOptionsBuilder: {
                    newOptions: function(){
                        return {
                            withDOM: function(){
                                return {
                                    withOption: function(){
                                        return {
                                            withButtons:function(){}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
        });

        window.jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
        return setTimeout((function() { return done(); }), 500);
    });

    it('should have controller scoped objects set up', function() {
        expect(ctrl.title).toEqual('Resource Usage')
        expect(ctrl.records).toBeUndefined()
    });

    it('should list usage records', function() {
        ctrl.listUsageRecords()
        httpBackend.expectGET('/usage_record/');
        httpBackend.flush();

        expect(ctrl.getRecords().length).toEqual(1)
    });
});

describe('Testing Capacity controller', function() {

    var ctrl, httpBackend, $scope
    var capacity = {
        "zone_name": [
            {"capacity_total": 100, "capacity_used": 10, "percent_used": "10.0", "type": 'Memory', "zone_id": "1", "zone_name": "zone_name"},
            {"capacity_total": 100, "capacity_used": 10, "percent_used": "10.0", "type": 'CPU', "zone_id": "1", "zone_name": "zone_name"},
        ]
    }

    beforeEach(function (done){
        module('iaasusage');

        apiServiceMock = jasmine.createSpyObj('apiService', ['buildAPIUrl']);

        inject(function($rootScope, $controller, $http, $httpBackend, $stateParams, $filter, apiService) {
            $scope = $rootScope.$new();
            httpBackend = $httpBackend

            apiServiceMock.buildAPIUrl.and.returnValue('/cloud_capacity/');

            $httpBackend.when('GET', '/api/v1/region/').respond([{key: 'cme', value: 'RJCME'}]);
            $httpBackend.when('GET', '/cloud_capacity/').respond(capacity);
            httpBackend.expectGET('/api/v1/region/');

            ctrl = $controller('CapacityCtrl', {
                $scope: $scope,
                $http: $http,
                $stateParams: $stateParams,
                $filter: $filter,
                apiService: apiServiceMock,
            });
        });

        window.jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
        return setTimeout((function() { return done(); }), 500);
    });

    it('should have controller scoped objects set up', function() {
        expect(ctrl.title).toEqual('Cloud Capacity by Zone')
        expect(ctrl.capacityReport).toBeUndefined()
        expect(ctrl.zones).toBeUndefined()
    });

    it('should get capacity report', function() {
        ctrl.getCapacityReport()
        httpBackend.expectGET('/cloud_capacity/');
        httpBackend.flush();

        expect(ctrl.zones.length).toEqual(1)
        expect(ctrl.zones[0]).toEqual('zone_name')
        expect(ctrl.capacityReport['zone_name'].length).toEqual(2)
    });
});

describe('Testing Auditing controller', function() {

    var ctrl, httpBackend, $scope


    beforeEach(function (done){
        module('iaasusage');

        apiServiceMock = jasmine.createSpyObj('apiService', ['buildAPIUrl']);

        inject(function($rootScope, $controller, $http, $httpBackend, $stateParams, $filter, apiService) {
            $scope = $rootScope.$new();
            httpBackend = $httpBackend

            apiServiceMock.buildAPIUrl.and.returnValue('/auditing_event/');

            $httpBackend.when('GET', '/api/v1/region/').respond([{key: 'cme', value: 'RJCME'}]);
            $httpBackend.when('GET', '/auditing_event/').respond({count: 2, events: [{}, {}]});
            httpBackend.expectGET('/api/v1/region/');

            ctrl = $controller('AuditingCtrl', {
                $scope: $scope,
                $http: $http,
                $stateParams: $stateParams,
                apiService: apiServiceMock,
            });
        });

        window.jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
        return setTimeout((function() { return done(); }), 500);
    });

    it('should have controller scoped objects set up', function() {
        expect(ctrl.title).toEqual('Auditing Events')
        expect(ctrl.pageNumber).toEqual(1)
        expect(ctrl.itemsPerPage).toEqual(10)
        expect(ctrl.count).toBeUndefined()
        expect(ctrl.events).toBeUndefined()
    });

    it('should return the list of events', function() {
        ctrl.listEvents()
        httpBackend.expectGET('/auditing_event/');
        httpBackend.flush();

        expect(ctrl.events.length).toEqual(2)
        expect(ctrl.count).toEqual(2)
    });
});