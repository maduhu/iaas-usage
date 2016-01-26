describe('Testing Region controller', function() {

    var rootScope, ctrl;
    var regionServiceMock;
    var region1 = {key: 'r1', value: 'region1'}
    var region2 = {key: 'r2', value: 'region2'}

    var regions = [region1, region2]

    beforeEach(function (done){
        module('iaasusage');
        regionServiceMock = jasmine.createSpyObj('regionService', ['listRegions', 'getCurrentRegion', 'changeCurrentRegion']);

        inject(function($rootScope, $controller) {
            $scope = $rootScope.$new();
            rootScope = $rootScope
            spyOn(rootScope, '$broadcast').and.callThrough();

            regionServiceMock.listRegions.and.returnValue(regions);
            regionServiceMock.getCurrentRegion.and.returnValue(region1);

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
        expect(regionServiceMock.changeCurrentRegion).toHaveBeenCalled();
        expect(rootScope.$broadcast).toHaveBeenCalledWith('regionChanged');
    });

    it('should change selector when toggleSelector is called', function() {
        expect(ctrl.selectorClass).toBeUndefined()
        ctrl.toggleSelector()
        expect(ctrl.selectorClass).toEqual('sidebar-open')
        ctrl.toggleSelector()
        expect(ctrl.selectorClass).toBeUndefined()
    });

    it('should call toggleSelector when event "regionChanged" is triggered', function() {
        rootScope.$broadcast('regionChanged')
        expect(ctrl.selectorClass).toEqual('sidebar-open')
    });
});

describe('Testing User controller', function() {

    var rootScope, $scope, ctrl, httpBackend, state;
    var apiService;
    var user = {"id": "1", "username": "user"}

    beforeEach(function (done){
        module('iaasusage');

        apiServiceMock = jasmine.createSpyObj('apiService', ['builAPIUrl']);

        inject(function($rootScope, $controller, $http, $state, $httpBackend) {
            $scope = $rootScope.$new();
            httpBackend = $httpBackend
            state = $state
            spyOn($scope, '$broadcast').and.callThrough();
            spyOn($state, 'go').and.callFake(function() { });

            apiServiceMock.builAPIUrl.and.returnValue('/current_user/');

            $httpBackend.when('GET', '/current_user/').respond([user]);

            ctrl = $controller('UserCtrl', {
                $scope: $scope,
                $http: $http,
                $state: $state,
                apiService: apiServiceMock
            });
        });

        window.jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
        return setTimeout((function() { return done(); }), 500);
    });

    it('should load current logged user from server', function() {
        ctrl.loadUser()
        httpBackend.expectGET('/current_user/');
        httpBackend.flush();
        expect(ctrl.user).toEqual(user)
        expect($scope.$broadcast).toHaveBeenCalledWith('userLoaded', user);
    });

    it('should trigger event when regionChanged event is received', function() {
        $scope.$broadcast('regionChanged')
        httpBackend.expectGET('/current_user/');
        httpBackend.flush();
        expect(state.go).toHaveBeenCalledWith('index.projects');
    });
});

describe('Testing Project controller', function() {

    var projects = [{"id":1, "name": "name","vm_count":1, "account": "account"}]
    var user = {"username": "user", "account_name": "acc", "domain_id": 1, "is_admin": false}
    var ctrl, httpBackend, $scope

    beforeEach(function (done){
        module('iaasusage');

        apiServiceMock = jasmine.createSpyObj('apiService', ['builAPIUrl']);

        inject(function($rootScope, $controller, $http, $httpBackend) {
            $scope = $rootScope.$new();
            httpBackend = $httpBackend

            apiServiceMock.builAPIUrl.and.returnValue('/project/');

            $httpBackend.when('GET', '/project/').respond(projects);

            ctrl = $controller('ProjectCtrl', {
                $scope: $scope,
                $http: $http,
                apiService: apiServiceMock,
                DTOptionsBuilder: {newOptions: function(){}}
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

        apiServiceMock = jasmine.createSpyObj('apiService', ['builAPIUrl']);

        inject(function($rootScope, $controller, $http, $httpBackend) {
            $scope = $rootScope.$new();
            httpBackend = $httpBackend

            apiServiceMock.builAPIUrl.and.returnValue('/instance/');
            $httpBackend.when('GET', '/instance/').respond(instances);

            ctrl = $controller('InstanceCtrl', {
                $scope: $scope,
                $http: $http,
                apiService: apiServiceMock,
                DTOptionsBuilder: {
                    newOptions: function(){
                        return { withDOM: function(){
                                    return {withButtons:function(){}
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

    it('should the list of instances be filtered by zone = 2', function() {
        ctrl.instances = [{"id": 1, "zone_id" : 1},{"id": 1, "zone_id" : 2}]
        ctrl.filter("zone_id", 2)
        expect(ctrl.getInstances().length).toEqual(1)
    });

    it('should filters be cleared', function() {
        ctrl.filter("zone_id", 2)
        ctrl.clearFilters()
        expect(ctrl.filters).toEqual({})
    });

    it("should mark field as filtered", function(){
        ctrl.filter("zone_id", 1)
        expect(ctrl.isFilteredField("zone_id", 1)).toBe(true)
        expect(ctrl.isFilteredField("zone_id", 2)).toBe(false)
    })

    it("should filter be removed if set twice", function(){
        ctrl.filter("zone_id", 1)
        ctrl.filter("zone_id", 1)
        expect(ctrl.isFilteredField("zone_id", 1)).toBe(false)
    })

    it("should fetch the list of instances from the server", function(){
        ctrl.listVirtualMachines()
        httpBackend.expectGET('/instance/');
        httpBackend.flush();

        expect(ctrl.getInstances().length).toEqual(2)
        expect(ctrl.getVmCount.length).not.toBeUndefined()
    })

    it("should tag filters be added and others filters be cleared", function(){
        ctrl.listVirtualMachines()
        ctrl.filter("zone_id", 2)
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