webpackJsonp([1],{

/***/ 318:
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(128);
__webpack_require__(339);
__webpack_require__(541);
__webpack_require__(543);
__webpack_require__(544);
__webpack_require__(545);
module.exports = __webpack_require__(546);


/***/ }),

/***/ 541:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _angular = __webpack_require__(62);

var _angular2 = _interopRequireDefault(_angular);

var _lodash = __webpack_require__(164);

var _lodash2 = _interopRequireDefault(_lodash);

__webpack_require__(165);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_angular2.default.module('brewbench-monitor', ['ui.router', 'nvd3', 'ngTouch', 'duScroll', 'ui.knob', 'rzModule']).config(function ($stateProvider, $urlRouterProvider, $httpProvider, $locationProvider, $compileProvider) {

  $httpProvider.defaults.useXDomain = true;
  $httpProvider.defaults.headers.common = 'Content-Type: application/json';
  delete $httpProvider.defaults.headers.common['X-Requested-With'];

  $locationProvider.hashPrefix('');
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob|chrome-extension|data|local):/);

  $stateProvider.state('home', {
    url: '',
    templateUrl: 'views/monitor.html',
    controller: 'mainCtrl'
  }).state('share', {
    url: '/sh/:file',
    templateUrl: 'views/monitor.html',
    controller: 'mainCtrl'
  }).state('reset', {
    url: '/reset',
    templateUrl: 'views/monitor.html',
    controller: 'mainCtrl'
  }).state('otherwise', {
    url: '*path',
    templateUrl: 'views/not-found.html'
  });
});

/***/ }),

/***/ 543:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function($) {

angular.module('brewbench-monitor').controller('mainCtrl', function ($scope, $state, $filter, $timeout, $interval, $q, $http, $sce, BrewService) {

  $scope.clearSettings = function (e) {
    if (e) {
      angular.element(e.target).html('Removing...');
    }
    BrewService.clear();
    window.location.href = '/';
  };

  if ($state.current.name == 'reset') $scope.clearSettings();

  var notification = null,
      resetChart = 100,
      timeout = null; //reset chart after 100 polls

  $scope.BrewService = BrewService;
  $scope.site = { https: !!(document.location.protocol == 'https:'),
    https_url: 'https://' + document.location.host
  };
  $scope.esp = {
    type: '8266',
    ssid: '',
    ssid_pass: '',
    hostname: '',
    autoconnect: false
  };
  $scope.hops;
  $scope.grains;
  $scope.water;
  $scope.lovibond;
  $scope.pkg;
  $scope.kettleTypes = BrewService.kettleTypes();
  $scope.showSettings = true;
  $scope.error = { message: '', type: 'danger' };
  $scope.slider = {
    min: 0,
    options: {
      floor: 0,
      ceil: 100,
      step: 5,
      translate: function translate(value) {
        return value + '%';
      },
      onEnd: function onEnd(kettleId, modelValue, highValue, pointerType) {
        var kettle = kettleId.split('_');
        var k;

        switch (kettle[0]) {
          case 'heat':
            k = $scope.kettles[kettle[1]].heater;
            break;
          case 'cool':
            k = $scope.kettles[kettle[1]].cooler;
            break;
          case 'pump':
            k = $scope.kettles[kettle[1]].pump;
            break;
        }

        if (!k) return;
        if ($scope.kettles[kettle[1]].active && k.pwm && k.running) {
          return $scope.toggleRelay($scope.kettles[kettle[1]], k, true);
        }
      }
    }
  };

  $scope.getKettleSliderOptions = function (type, index) {
    return Object.assign($scope.slider.options, { id: type + '_' + index });
  };

  $scope.getLovibondColor = function (range) {
    range = range.replace(/°/g, '').replace(/ /g, '');
    if (range.indexOf('-') !== -1) {
      var rArr = range.split('-');
      range = (parseFloat(rArr[0]) + parseFloat(rArr[1])) / 2;
    } else {
      range = parseFloat(range);
    }
    if (!range) return '';
    var l = _.filter($scope.lovibond, function (item) {
      return item.srm <= range ? item.hex : '';
    });
    if (!!l.length) return l[l.length - 1].hex;
    return '';
  };

  //default settings values
  $scope.settings = BrewService.settings('settings') || BrewService.reset();
  // general check and update
  if (!$scope.settings.general) return $scope.clearSettings();
  $scope.chartOptions = BrewService.chartOptions({ unit: $scope.settings.general.unit, chart: $scope.settings.chart, session: $scope.settings.streams.session });
  $scope.kettles = BrewService.settings('kettles') || BrewService.defaultKettles();
  $scope.share = !$state.params.file && BrewService.settings('share') ? BrewService.settings('share') : {
    file: $state.params.file || null,
    password: null,
    needPassword: false,
    access: 'readOnly',
    deleteAfter: 14
  };

  $scope.sumValues = function (obj) {
    return _.sumBy(obj, 'amount');
  };

  // init calc values
  $scope.updateABV = function () {
    if ($scope.settings.recipe.scale == 'gravity') {
      if ($scope.settings.recipe.method == 'papazian') $scope.settings.recipe.abv = BrewService.abv($scope.settings.recipe.og, $scope.settings.recipe.fg);else $scope.settings.recipe.abv = BrewService.abva($scope.settings.recipe.og, $scope.settings.recipe.fg);
      $scope.settings.recipe.abw = BrewService.abw($scope.settings.recipe.abv, $scope.settings.recipe.fg);
      $scope.settings.recipe.attenuation = BrewService.attenuation(BrewService.plato($scope.settings.recipe.og), BrewService.plato($scope.settings.recipe.fg));
      $scope.settings.recipe.calories = BrewService.calories($scope.settings.recipe.abw, BrewService.re(BrewService.plato($scope.settings.recipe.og), BrewService.plato($scope.settings.recipe.fg)), $scope.settings.recipe.fg);
    } else {
      if ($scope.settings.recipe.method == 'papazian') $scope.settings.recipe.abv = BrewService.abv(BrewService.sg($scope.settings.recipe.og), BrewService.sg($scope.settings.recipe.fg));else $scope.settings.recipe.abv = BrewService.abva(BrewService.sg($scope.settings.recipe.og), BrewService.sg($scope.settings.recipe.fg));
      $scope.settings.recipe.abw = BrewService.abw($scope.settings.recipe.abv, BrewService.sg($scope.settings.recipe.fg));
      $scope.settings.recipe.attenuation = BrewService.attenuation($scope.settings.recipe.og, $scope.settings.recipe.fg);
      $scope.settings.recipe.calories = BrewService.calories($scope.settings.recipe.abw, BrewService.re($scope.settings.recipe.og, $scope.settings.recipe.fg), BrewService.sg($scope.settings.recipe.fg));
    }
  };

  $scope.changeMethod = function (method) {
    $scope.settings.recipe.method = method;
    $scope.updateABV();
  };

  $scope.changeScale = function (scale) {
    $scope.settings.recipe.scale = scale;
    if (scale == 'gravity') {
      $scope.settings.recipe.og = BrewService.sg($scope.settings.recipe.og);
      $scope.settings.recipe.fg = BrewService.sg($scope.settings.recipe.fg);
    } else {
      $scope.settings.recipe.og = BrewService.plato($scope.settings.recipe.og);
      $scope.settings.recipe.fg = BrewService.plato($scope.settings.recipe.fg);
    }
  };

  $scope.getStatusClass = function (status) {
    if (status == 'Connected') return 'success';else if (_.endsWith(status, 'ing')) return 'secondary';else return 'danger';
  };

  $scope.updateABV();

  $scope.getPortRange = function (number) {
    number++;
    return Array(number).fill().map(function (_, idx) {
      return 0 + idx;
    });
  };

  $scope.arduinos = {
    add: function add() {
      var now = new Date();
      if (!$scope.settings.arduinos) $scope.settings.arduinos = [];
      $scope.settings.arduinos.push({
        id: btoa(now + '' + $scope.settings.arduinos.length + 1),
        url: 'arduino.local',
        board: '',
        analog: 5,
        digital: 13,
        adc: 0,
        secure: false,
        version: '',
        status: { error: '', dt: '', message: '' }
      });
      _.each($scope.kettles, function (kettle) {
        if (!kettle.arduino) kettle.arduino = $scope.settings.arduinos[0];
      });
    },
    update: function update(arduino) {
      _.each($scope.kettles, function (kettle) {
        if (kettle.arduino && kettle.arduino.id == arduino.id) kettle.arduino = arduino;
      });
    },
    delete: function _delete(index, arduino) {
      $scope.settings.arduinos.splice(index, 1);
      _.each($scope.kettles, function (kettle) {
        if (kettle.arduino && kettle.arduino.id == arduino.id) delete kettle.arduino;
      });
    },
    connect: function connect(arduino) {
      arduino.status.dt = '';
      arduino.status.error = '';
      arduino.status.message = 'Connecting...';
      BrewService.connect(arduino).then(function (info) {
        if (info && info.BrewBench) {
          event.srcElement.innerHTML = 'Connect';
          arduino.board = info.BrewBench.board;
          arduino.version = info.BrewBench.version;
          arduino.status.dt = new Date();
          arduino.status.error = '';
          arduino.status.message = '';
          if (arduino.board.indexOf('ESP32') == 0) {
            arduino.analog = 0;
            arduino.digital = 33;
          } else if (arduino.board.indexOf('ESP8266') == 0) {
            arduino.analog = 0;
            arduino.digital = 10;
          }
        }
      }).catch(function (err) {
        if (err && err.status == -1) {
          arduino.status.dt = '';
          arduino.status.message = '';
          arduino.status.error = 'Could not connect';
        }
      });
    }
  };

  $scope.tplink = {
    login: function login() {
      $scope.settings.tplink.status = 'Connecting';
      BrewService.tplink().login($scope.settings.tplink.user, $scope.settings.tplink.pass).then(function (response) {
        if (response.token) {
          $scope.settings.tplink.status = 'Connected';
          $scope.settings.tplink.token = response.token;
          $scope.tplink.scan(response.token);
        }
      }).catch(function (err) {
        $scope.settings.tplink.status = 'Failed to Connect';
        $scope.setErrorMessage(err.msg || err);
      });
    },
    scan: function scan(token) {
      $scope.settings.tplink.plugs = [];
      $scope.settings.tplink.status = 'Scanning';
      BrewService.tplink().scan(token).then(function (response) {
        if (response.deviceList) {
          $scope.settings.tplink.status = 'Connected';
          $scope.settings.tplink.plugs = response.deviceList;
          // get device info if online (ie. status==1)
          _.each($scope.settings.tplink.plugs, function (plug) {
            if (!!plug.status) {
              BrewService.tplink().info(plug).then(function (info) {
                if (info && info.responseData) {
                  plug.info = JSON.parse(info.responseData).system.get_sysinfo;
                  if (JSON.parse(info.responseData).emeter.get_realtime.err_code == 0) {
                    plug.power = JSON.parse(info.responseData).emeter.get_realtime;
                  } else {
                    plug.power = null;
                  }
                }
              });
            }
          });
        }
      });
    },
    info: function info(device) {
      BrewService.tplink().info(device).then(function (response) {
        return response;
      });
    },
    toggle: function toggle(device) {
      var offOrOn = device.info.relay_state == 1 ? 0 : 1;
      BrewService.tplink().toggle(device, offOrOn).then(function (response) {
        device.info.relay_state = offOrOn;
        return response;
      }).then(function (toggleResponse) {
        $timeout(function () {
          // update the info
          return BrewService.tplink().info(device).then(function (info) {
            if (info && info.responseData) {
              device.info = JSON.parse(info.responseData).system.get_sysinfo;
              if (JSON.parse(info.responseData).emeter.get_realtime.err_code == 0) {
                device.power = JSON.parse(info.responseData).emeter.get_realtime;
              } else {
                device.power = null;
              }
              return device;
            }
            return device;
          });
        }, 1000);
      });
    }
  };

  $scope.addKettle = function (type) {
    if (!$scope.kettles) $scope.kettles = [];
    var arduino = $scope.settings.arduinos.length ? $scope.settings.arduinos[0] : { id: 'local-' + btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13, adc: 0, secure: false };
    $scope.kettles.push({
      name: type ? _.find($scope.kettleTypes, { type: type }).name : $scope.kettleTypes[0].name,
      id: null,
      type: type || $scope.kettleTypes[0].type,
      active: false,
      sticky: false,
      heater: { pin: 'D6', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
      pump: { pin: 'D7', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
      temp: { pin: 'A0', vcc: '', index: '', type: 'Thermistor', adc: false, hit: false, current: 0, measured: 0, previous: 0, adjust: 0, target: $scope.kettleTypes[0].target, diff: $scope.kettleTypes[0].diff, raw: 0, volts: 0 },
      values: [],
      timers: [],
      knob: angular.copy(BrewService.defaultKnobOptions(), { value: 0, min: 0, max: $scope.kettleTypes[0].target + $scope.kettleTypes[0].diff }),
      arduino: arduino,
      message: { type: 'error', message: '', version: '', count: 0, location: '' },
      notify: { slack: false, dweet: false, streams: false }
    });
  };

  $scope.hasStickyKettles = function (type) {
    return _.filter($scope.kettles, { 'sticky': true }).length;
  };

  $scope.kettleCount = function (type) {
    return _.filter($scope.kettles, { 'type': type }).length;
  };

  $scope.activeKettles = function () {
    return _.filter($scope.kettles, { 'active': true }).length;
  };

  $scope.pinDisplay = function (pin) {
    if (pin.indexOf('TP-') === 0) {
      var device = _.filter($scope.settings.tplink.plugs, { deviceId: pin.substr(3) })[0];
      return device ? device.alias : '';
    } else return pin;
  };

  $scope.pinInUse = function (pin, arduinoId) {
    var kettle = _.find($scope.kettles, function (kettle) {
      return kettle.arduino.id == arduinoId && (kettle.temp.pin == pin || kettle.temp.vcc == pin || kettle.heater.pin == pin || kettle.cooler && kettle.cooler.pin == pin || !kettle.cooler && kettle.pump.pin == pin);
    });
    return kettle || false;
  };

  $scope.changeSensor = function (kettle) {
    if (!!BrewService.sensorTypes(kettle.temp.type).percent) {
      kettle.knob.unit = '%';
    } else {
      kettle.knob.unit = '\xB0';
    }
    kettle.temp.vcc = '';
    kettle.temp.index = '';
  };

  $scope.createShare = function () {
    if (!$scope.settings.recipe.brewer.name || !$scope.settings.recipe.brewer.email) return;
    $scope.share_status = 'Creating share link...';
    return BrewService.createShare($scope.share).then(function (response) {
      if (response.share && response.share.url) {
        $scope.share_status = '';
        $scope.share_success = true;
        $scope.share_link = response.share.url;
      } else {
        $scope.share_success = false;
      }
      BrewService.settings('share', $scope.share);
    }).catch(function (err) {
      $scope.share_status = err;
      $scope.share_success = false;
      BrewService.settings('share', $scope.share);
    });
  };

  $scope.shareTest = function (arduino) {
    arduino.testing = true;
    BrewService.shareTest(arduino).then(function (response) {
      arduino.testing = false;
      if (response.http_code == 200) arduino.public = true;else arduino.public = false;
    }).catch(function (err) {
      arduino.testing = false;
      arduino.public = false;
    });
  };

  $scope.influxdb = {
    brewbenchHosted: function brewbenchHosted() {
      return $scope.settings.influxdb.url.indexOf('streams.brewbench.co') !== -1;
    },
    remove: function remove() {
      var defaultSettings = BrewService.reset();
      $scope.settings.influxdb = defaultSettings.influxdb;
    },
    connect: function connect() {
      $scope.settings.influxdb.status = 'Connecting';
      BrewService.influxdb().ping($scope.settings.influxdb).then(function (response) {
        if (response.status == 204 || response.status == 200) {
          $('#influxdbUrl').removeClass('is-invalid');
          $scope.settings.influxdb.status = 'Connected';
          if ($scope.influxdb.brewbenchHosted()) {
            $scope.settings.influxdb.db = $scope.settings.influxdb.user;
          } else {
            //get list of databases
            BrewService.influxdb().dbs().then(function (response) {
              if (response.length) {
                var dbs = [].concat.apply([], response);
                $scope.settings.influxdb.dbs = _.remove(dbs, function (db) {
                  return db != "_internal";
                });
              }
            });
          }
        } else {
          $('#influxdbUrl').addClass('is-invalid');
          $scope.settings.influxdb.status = 'Failed to Connect';
        }
      }).catch(function (err) {
        $('#influxdbUrl').addClass('is-invalid');
        $scope.settings.influxdb.status = 'Failed to Connect';
      });
    },
    create: function create() {
      var db = $scope.settings.influxdb.db || 'session-' + moment().format('YYYY-MM-DD');
      $scope.settings.influxdb.created = false;
      BrewService.influxdb().createDB(db).then(function (response) {
        // prompt for password
        if (response.data && response.data.results && response.data.results.length) {
          $scope.settings.influxdb.db = db;
          $scope.settings.influxdb.created = true;
          $('#influxdbUser').removeClass('is-invalid');
          $('#influxdbPass').removeClass('is-invalid');
          $scope.resetError();
        } else {
          $scope.setErrorMessage("Opps, there was a problem creating the database.");
        }
      }).catch(function (err) {
        if (err.status && (err.status == 401 || err.status == 403)) {
          $('#influxdbUser').addClass('is-invalid');
          $('#influxdbPass').addClass('is-invalid');
          $scope.setErrorMessage("Enter your Username and Password for InfluxDB");
        } else if (err) {
          $scope.setErrorMessage(err);
        } else {
          $scope.setErrorMessage("Opps, there was a problem creating the database.");
        }
      });
    }
  };

  $scope.streams = {
    connected: function connected() {
      return !!$scope.settings.streams.username && !!$scope.settings.streams.api_key && $scope.settings.streams.status == 'Connected';
    },
    remove: function remove() {
      var defaultSettings = BrewService.reset();
      $scope.settings.streams = defaultSettings.streams;
      _.each($scope.kettles, function (kettle) {
        kettle.notify.streams = false;
      });
    },
    connect: function connect() {
      if (!$scope.settings.streams.username || !$scope.settings.streams.api_key) return;
      $scope.settings.streams.status = 'Connecting';
      return BrewService.streams().auth(true).then(function (response) {
        $scope.settings.streams.status = 'Connected';
      }).catch(function (err) {
        $scope.settings.streams.status = 'Failed to Connect';
      });
    },
    kettles: function kettles(kettle, relay) {
      if (relay) {
        kettle[relay].sketch = !kettle[relay].sketch;
        if (!kettle.notify.streams) return;
      }
      kettle.message.location = 'sketches';
      kettle.message.type = 'info';
      kettle.message.status = 0;
      return BrewService.streams().kettles.save(kettle).then(function (response) {
        var kettleResponse = response.kettle;
        // update kettle vars
        kettle.id = kettleResponse.id;
        // update arduino id
        _.each($scope.settings.arduinos, function (arduino) {
          if (arduino.id == kettle.arduino.id) arduino.id = kettleResponse.deviceId;
        });
        kettle.arduino.id = kettleResponse.deviceId;
        // update session vars
        _.merge($scope.settings.streams.session, kettleResponse.session);

        kettle.message.type = 'success';
        kettle.message.status = 2;
      }).catch(function (err) {
        kettle.notify.streams = !kettle.notify.streams;
        kettle.message.status = 1;
        if (err && err.data && err.data.error && err.data.error.message) {
          $scope.setErrorMessage(err.data.error.message, kettle);
          console.error('BrewBench Streams Error', err);
        }
      });
    },
    sessions: {
      save: function save() {
        return BrewService.streams().sessions.save($scope.settings.streams.session).then(function (response) {});
      }
    }
  };

  $scope.shareAccess = function (access) {
    if ($scope.settings.general.shared) {
      if (access) {
        if (access == 'embed') {
          return !!window.frameElement;
        } else {
          return !!($scope.share.access && $scope.share.access === access);
        }
      }
      return true;
    } else if (access && access == 'embed') {
      return !!window.frameElement;
    }
    return true;
  };

  $scope.loadShareFile = function () {
    BrewService.clear();
    $scope.settings = BrewService.reset();
    $scope.settings.general.shared = true;
    return BrewService.loadShareFile($scope.share.file, $scope.share.password || null).then(function (contents) {
      if (contents) {
        if (contents.needPassword) {
          $scope.share.needPassword = true;
          if (contents.settings.recipe) {
            $scope.settings.recipe = contents.settings.recipe;
          }
          return false;
        } else {
          $scope.share.needPassword = false;
          if (contents.share && contents.share.access) {
            $scope.share.access = contents.share.access;
          }
          if (contents.settings) {
            $scope.settings = contents.settings;
            $scope.settings.notifications = { on: false, timers: true, high: true, low: true, target: true, slack: '', last: '' };
          }
          if (contents.kettles) {
            _.each(contents.kettles, function (kettle) {
              kettle.knob = angular.copy(BrewService.defaultKnobOptions(), { value: 0, min: 0, max: 200 + 5, subText: { enabled: true, text: 'starting...', color: 'gray', font: 'auto' } });
              kettle.values = [];
            });
            $scope.kettles = contents.kettles;
          }
          return $scope.processTemps();
        }
      } else {
        return false;
      }
    }).catch(function (err) {
      $scope.setErrorMessage("Opps, there was a problem loading the shared session.");
    });
  };

  $scope.importRecipe = function ($fileContent, $ext) {

    // parse the imported content
    var formatted_content = BrewService.formatXML($fileContent);
    var jsonObj,
        recipe = null;

    if (!!formatted_content) {
      var x2js = new X2JS();
      jsonObj = x2js.xml_str2json(formatted_content);
    }

    if (!jsonObj) return $scope.recipe_success = false;

    if ($ext == 'bsmx') {
      if (!!jsonObj.Recipes && !!jsonObj.Recipes.Data.Recipe) recipe = jsonObj.Recipes.Data.Recipe;else if (!!jsonObj.Selections && !!jsonObj.Selections.Data.Recipe) recipe = jsonObj.Selections.Data.Recipe;
      if (recipe) recipe = BrewService.recipeBeerSmith(recipe);else return $scope.recipe_success = false;
    } else if ($ext == 'xml') {
      if (!!jsonObj.RECIPES && !!jsonObj.RECIPES.RECIPE) recipe = jsonObj.RECIPES.RECIPE;
      if (recipe) recipe = BrewService.recipeBeerXML(recipe);else return $scope.recipe_success = false;
    }

    if (!recipe) return $scope.recipe_success = false;

    if (!!recipe.og) $scope.settings.recipe.og = recipe.og;
    if (!!recipe.fg) $scope.settings.recipe.fg = recipe.fg;

    $scope.settings.recipe.name = recipe.name;
    $scope.settings.recipe.category = recipe.category;
    $scope.settings.recipe.abv = recipe.abv;
    $scope.settings.recipe.ibu = recipe.ibu;
    $scope.settings.recipe.date = recipe.date;
    $scope.settings.recipe.brewer = recipe.brewer;

    if (recipe.grains.length) {
      // recipe display
      $scope.settings.recipe.grains = [];
      _.each(recipe.grains, function (grain) {
        if ($scope.settings.recipe.grains.length && _.filter($scope.settings.recipe.grains, { name: grain.label }).length) {
          _.filter($scope.settings.recipe.grains, { name: grain.label })[0].amount += parseFloat(grain.amount);
        } else {
          $scope.settings.recipe.grains.push({
            name: grain.label, amount: parseFloat(grain.amount)
          });
        }
      });
      // timers
      var kettle = _.filter($scope.kettles, { type: 'grain' })[0];
      if (kettle) {
        kettle.timers = [];
        _.each(recipe.grains, function (grain) {
          if (kettle) {
            $scope.addTimer(kettle, {
              label: grain.label,
              min: grain.min,
              notes: grain.notes
            });
          }
        });
      }
    }

    if (recipe.hops.length) {
      // recipe display
      $scope.settings.recipe.hops = [];
      _.each(recipe.hops, function (hop) {
        if ($scope.settings.recipe.hops.length && _.filter($scope.settings.recipe.hops, { name: hop.label }).length) {
          _.filter($scope.settings.recipe.hops, { name: hop.label })[0].amount += parseFloat(hop.amount);
        } else {
          $scope.settings.recipe.hops.push({
            name: hop.label, amount: parseFloat(hop.amount)
          });
        }
      });
      // timers
      var kettle = _.filter($scope.kettles, { type: 'hop' })[0];
      if (kettle) {
        kettle.timers = [];
        _.each(recipe.hops, function (hop) {
          if (kettle) {
            $scope.addTimer(kettle, {
              label: hop.label,
              min: hop.min,
              notes: hop.notes
            });
          }
        });
      }
    }
    if (recipe.misc.length) {
      // timers
      var kettle = _.filter($scope.kettles, { type: 'water' })[0];
      if (kettle) {
        kettle.timers = [];
        _.each(recipe.misc, function (misc) {
          $scope.addTimer(kettle, {
            label: misc.label,
            min: misc.min,
            notes: misc.notes
          });
        });
      }
    }
    if (recipe.yeast.length) {
      // recipe display
      $scope.settings.recipe.yeast = [];
      _.each(recipe.yeast, function (yeast) {
        $scope.settings.recipe.yeast.push({
          name: yeast.name
        });
      });
    }
    $scope.recipe_success = true;
  };

  $scope.loadStyles = function () {
    if (!$scope.styles) {
      BrewService.styles().then(function (response) {
        $scope.styles = response;
      });
    }
  };

  $scope.loadConfig = function () {
    var config = [];
    if (!$scope.pkg) {
      config.push(BrewService.pkg().then(function (response) {
        $scope.pkg = response;
      }));
    }

    if (!$scope.grains) {
      config.push(BrewService.grains().then(function (response) {
        return $scope.grains = _.sortBy(_.uniqBy(response, 'name'), 'name');
      }));
    }

    if (!$scope.hops) {
      config.push(BrewService.hops().then(function (response) {
        return $scope.hops = _.sortBy(_.uniqBy(response, 'name'), 'name');
      }));
    }

    if (!$scope.water) {
      config.push(BrewService.water().then(function (response) {
        return $scope.water = _.sortBy(_.uniqBy(response, 'salt'), 'salt');
      }));
    }

    if (!$scope.lovibond) {
      config.push(BrewService.lovibond().then(function (response) {
        return $scope.lovibond = response;
      }));
    }

    return $q.all(config);
  };

  // check if pump or heater are running
  $scope.init = function () {
    $scope.showSettings = !$scope.settings.general.shared;
    if ($scope.share.file) return $scope.loadShareFile();

    _.each($scope.kettles, function (kettle) {
      //update max
      kettle.knob.max = kettle.temp['target'] + kettle.temp['diff'] + 10;
      // check timers for running
      if (!!kettle.timers && kettle.timers.length) {
        _.each(kettle.timers, function (timer) {
          if (timer.running) {
            timer.running = false;
            $scope.timerStart(timer, kettle);
          } else if (!timer.running && timer.queue) {
            $timeout(function () {
              $scope.timerStart(timer, kettle);
            }, 60000);
          } else if (timer.up && timer.up.running) {
            timer.up.running = false;
            $scope.timerStart(timer.up);
          }
        });
      }
      $scope.updateKnobCopy(kettle);
    });

    return true;
  };

  $scope.setErrorMessage = function (err, kettle, location) {
    if (!!$scope.settings.general.shared) {
      $scope.error.type = 'warning';
      $scope.error.message = $sce.trustAsHtml('The monitor seems to be off-line, re-connecting...');
    } else {
      var message;

      if (typeof err == 'string' && err.indexOf('{') !== -1) {
        if (!Object.keys(err).length) return;
        err = JSON.parse(err);
        if (!Object.keys(err).length) return;
      }

      if (typeof err == 'string') message = err;else if (!!err.statusText) message = err.statusText;else if (err.config && err.config.url) message = err.config.url;else if (err.version) {
        if (kettle) kettle.message.version = err.version;
      } else {
        message = JSON.stringify(err);
        if (message == '{}') message = '';
      }

      if (!!message) {
        if (kettle) {
          kettle.message.type = 'danger';
          kettle.message.count = 0;
          kettle.message.message = $sce.trustAsHtml('Connection error: ' + message);
          if (location) kettle.message.location = location;
          $scope.updateArduinoStatus({ kettle: kettle }, message);
          $scope.updateKnobCopy(kettle);
        } else {
          $scope.error.message = $sce.trustAsHtml('Error: ' + message);
        }
      } else if (kettle) {
        kettle.message.count = 0;
        kettle.message.message = $sce.trustAsHtml('Error connecting to ' + BrewService.domain(kettle.arduino));
        $scope.updateArduinoStatus({ kettle: kettle }, kettle.message.message);
      } else {
        $scope.error.message = $sce.trustAsHtml('Connection error:');
      }
    }
  };
  $scope.updateArduinoStatus = function (response, error) {
    var arduino = _.filter($scope.settings.arduinos, { id: response.kettle.arduino.id });
    if (arduino.length) {
      arduino[0].status.dt = new Date();
      if (response.sketch_version) arduino[0].version = response.sketch_version;
      if (error) arduino[0].status.error = error;else arduino[0].status.error = '';
    }
  };

  $scope.resetError = function (kettle) {
    if (kettle) {
      kettle.message.count = 0;
      kettle.message.message = $sce.trustAsHtml('');
      $scope.updateArduinoStatus({ kettle: kettle });
    } else {
      $scope.error.type = 'danger';
      $scope.error.message = $sce.trustAsHtml('');
    }
  };

  $scope.updateTemp = function (response, kettle) {
    if (!response) {
      return false;
    }

    $scope.resetError(kettle);
    // needed for charts
    kettle.key = kettle.name;
    var temps = [];
    //chart date
    var date = new Date();
    //update datatype
    response.temp = parseFloat(response.temp);
    response.raw = parseFloat(response.raw);
    if (response.volts) response.volts = parseFloat(response.volts);

    if (!!kettle.temp.current) kettle.temp.previous = kettle.temp.current;
    // temp response is in C
    kettle.temp.measured = $scope.settings.general.unit == 'F' ? $filter('toFahrenheit')(response.temp) : $filter('round')(response.temp, 2);
    // add adjustment
    kettle.temp.current = parseFloat(kettle.temp.measured) + parseFloat(kettle.temp.adjust);
    // set raw
    kettle.temp.raw = response.raw;
    kettle.temp.volts = response.volts;

    // volt check
    if (kettle.temp.volts) {
      if (kettle.temp.type == 'Thermistor' && kettle.temp.pin.indexOf('A') === 0 && !BrewService.isESP(kettle.arduino) && kettle.temp.volts < 2) {
        $scope.setErrorMessage('Sensor is not connected', kettle);
        return;
      }
    } else if (kettle.temp.type != 'BMP180' && !kettle.temp.volts && !kettle.temp.raw) {
      $scope.setErrorMessage('Sensor is not connected', kettle);
      return;
    } else if (kettle.temp.type == 'DS18B20' && response.temp == -127) {
      $scope.setErrorMessage('Sensor is not connected', kettle);
      return;
    }

    // reset all kettles every resetChart
    if (kettle.values.length > resetChart) {
      $scope.kettles.map(function (k) {
        return k.values.shift();
      });
    }

    //DHT sensors have humidity as a percent
    //SoilMoistureD has moisture as a percent
    if (typeof response.percent != 'undefined') {
      kettle.percent = response.percent;
    }
    // BMP sensors have altitude and pressure
    if (typeof response.altitude != 'undefined') {
      kettle.altitude = response.altitude;
    }
    if (typeof response.pressure != 'undefined') {
      // pascal to inches of mercury
      kettle.pressure = response.pressure / 3386.389;
    }

    $scope.updateKnobCopy(kettle);
    $scope.updateArduinoStatus({ kettle: kettle, sketch_version: response.sketch_version });

    var currentValue = kettle.temp.current;
    var unitType = '\xB0';
    //percent?
    if (!!BrewService.sensorTypes(kettle.temp.type).percent && typeof kettle.percent != 'undefined') {
      currentValue = kettle.percent;
      unitType = '%';
    } else {
      kettle.values.push([date.getTime(), currentValue]);
    }

    //is temp too high?
    if (currentValue > kettle.temp.target + kettle.temp.diff) {
      //stop the heating element
      if (kettle.heater.auto && kettle.heater.running) {
        temps.push($scope.toggleRelay(kettle, kettle.heater, false));
      }
      //stop the pump
      if (kettle.pump && kettle.pump.auto && kettle.pump.running) {
        temps.push($scope.toggleRelay(kettle, kettle.pump, false));
      }
      //start the chiller
      if (kettle.cooler && kettle.cooler.auto && !kettle.cooler.running) {
        temps.push($scope.toggleRelay(kettle, kettle.cooler, true).then(function (cooler) {
          kettle.knob.subText.text = 'cooling';
          kettle.knob.subText.color = 'rgba(52,152,219,1)';
        }));
      }
    } //is temp too low?
    else if (currentValue < kettle.temp.target - kettle.temp.diff) {
        $scope.notify(kettle);
        //start the heating element
        if (kettle.heater.auto && !kettle.heater.running) {
          temps.push($scope.toggleRelay(kettle, kettle.heater, true).then(function (heating) {
            kettle.knob.subText.text = 'heating';
            kettle.knob.subText.color = 'rgba(200,47,47,1)';
          }));
        }
        //start the pump
        if (kettle.pump && kettle.pump.auto && !kettle.pump.running) {
          temps.push($scope.toggleRelay(kettle, kettle.pump, true));
        }
        //stop the cooler
        if (kettle.cooler && kettle.cooler.auto && kettle.cooler.running) {
          temps.push($scope.toggleRelay(kettle, kettle.cooler, false));
        }
      } else {
        // within target!
        kettle.temp.hit = new Date(); //set the time the target was hit so we can now start alerts
        $scope.notify(kettle);
        //stop the heater
        if (kettle.heater.auto && kettle.heater.running) {
          temps.push($scope.toggleRelay(kettle, kettle.heater, false));
        }
        //stop the pump
        if (kettle.pump && kettle.pump.auto && kettle.pump.running) {
          temps.push($scope.toggleRelay(kettle, kettle.pump, false));
        }
        //stop the cooler
        if (kettle.cooler && kettle.cooler.auto && kettle.cooler.running) {
          temps.push($scope.toggleRelay(kettle, kettle.cooler, false));
        }
      }
    return $q.all(temps);
  };

  $scope.getNavOffset = function () {
    return 125 + angular.element(document.getElementById('navbar'))[0].offsetHeight;
  };

  $scope.addTimer = function (kettle, options) {
    if (!kettle.timers) kettle.timers = [];
    if (options) {
      options.min = options.min ? options.min : 0;
      options.sec = options.sec ? options.sec : 0;
      options.running = options.running ? options.running : false;
      options.queue = options.queue ? options.queue : false;
      kettle.timers.push(options);
    } else {
      kettle.timers.push({ label: 'Edit label', min: 60, sec: 0, running: false, queue: false });
    }
  };

  $scope.removeTimers = function (e, kettle) {
    var btn = angular.element(e.target);
    if (btn.hasClass('fa-trash')) btn = btn.parent();

    if (!btn.hasClass('btn-danger')) {
      btn.removeClass('btn-light').addClass('btn-danger');
      $timeout(function () {
        btn.removeClass('btn-danger').addClass('btn-light');
      }, 2000);
    } else {
      btn.removeClass('btn-danger').addClass('btn-light');
      kettle.timers = [];
    }
  };

  $scope.togglePWM = function (kettle) {
    kettle.pwm = !kettle.pwm;
    if (kettle.pwm) kettle.ssr = true;
  };

  $scope.toggleKettle = function (item, kettle) {

    var k;

    switch (item) {
      case 'heat':
        k = kettle.heater;
        break;
      case 'cool':
        k = kettle.cooler;
        break;
      case 'pump':
        k = kettle.pump;
        break;
    }

    if (!k) return;

    k.running = !k.running;

    if (kettle.active && k.running) {
      //start the relay
      $scope.toggleRelay(kettle, k, true);
    } else if (!k.running) {
      //stop the relay
      $scope.toggleRelay(kettle, k, false);
    }
  };

  $scope.hasSketches = function (kettle) {
    var hasASketch = false;
    _.each($scope.kettles, function (kettle) {
      if (kettle.heater && kettle.heater.sketch || kettle.cooler && kettle.cooler.sketch || kettle.notify.streams || kettle.notify.slack || kettle.notify.dweet) {
        hasASketch = true;
      }
    });
    return hasASketch;
  };

  $scope.startStopKettle = function (kettle) {
    kettle.active = !kettle.active;
    $scope.resetError(kettle);
    var date = new Date();
    if (kettle.active) {
      kettle.knob.subText.text = 'starting...';

      BrewService.temp(kettle).then(function (response) {
        return $scope.updateTemp(response, kettle);
      }).catch(function (err) {
        // udpate chart with current
        kettle.values.push([date.getTime(), kettle.temp.current]);
        kettle.message.count++;
        if (kettle.message.count == 7) $scope.setErrorMessage(err, kettle);
      });

      // start the relays
      if (kettle.heater.running) {
        $scope.toggleRelay(kettle, kettle.heater, true);
      }
      if (kettle.pump && kettle.pump.running) {
        $scope.toggleRelay(kettle, kettle.pump, true);
      }
      if (kettle.cooler && kettle.cooler.running) {
        $scope.toggleRelay(kettle, kettle.cooler, true);
      }
    } else {

      //stop the heater
      if (!kettle.active && kettle.heater.running) {
        $scope.toggleRelay(kettle, kettle.heater, false);
      }
      //stop the pump
      if (!kettle.active && kettle.pump && kettle.pump.running) {
        $scope.toggleRelay(kettle, kettle.pump, false);
      }
      //stop the cooler
      if (!kettle.active && kettle.cooler && kettle.cooler.running) {
        $scope.toggleRelay(kettle, kettle.cooler, false);
      }
      if (!kettle.active) {
        if (kettle.pump) kettle.pump.auto = false;
        if (kettle.heater) kettle.heater.auto = false;
        if (kettle.cooler) kettle.cooler.auto = false;
        $scope.updateKnobCopy(kettle);
      }
    }
  };

  $scope.toggleRelay = function (kettle, element, on) {
    if (on) {
      if (element.pin.indexOf('TP-') === 0) {
        var device = _.filter($scope.settings.tplink.plugs, { deviceId: element.pin.substr(3) })[0];
        return BrewService.tplink().on(device).then(function () {
          //started
          element.running = true;
        }).catch(function (err) {
          return $scope.setErrorMessage(err, kettle);
        });
      } else if (element.pwm) {
        return BrewService.analog(kettle, element.pin, Math.round(255 * element.dutyCycle / 100)).then(function () {
          //started
          element.running = true;
        }).catch(function (err) {
          return $scope.setErrorMessage(err, kettle);
        });
      } else if (element.ssr) {
        return BrewService.analog(kettle, element.pin, 255).then(function () {
          //started
          element.running = true;
        }).catch(function (err) {
          return $scope.setErrorMessage(err, kettle);
        });
      } else {
        return BrewService.digital(kettle, element.pin, 1).then(function () {
          //started
          element.running = true;
        }).catch(function (err) {
          return $scope.setErrorMessage(err, kettle);
        });
      }
    } else {
      if (element.pin.indexOf('TP-') === 0) {
        var device = _.filter($scope.settings.tplink.plugs, { deviceId: element.pin.substr(3) })[0];
        return BrewService.tplink().off(device).then(function () {
          //started
          element.running = false;
        }).catch(function (err) {
          return $scope.setErrorMessage(err, kettle);
        });
      } else if (element.pwm || element.ssr) {
        return BrewService.analog(kettle, element.pin, 0).then(function () {
          element.running = false;
          $scope.updateKnobCopy(kettle);
        }).catch(function (err) {
          return $scope.setErrorMessage(err, kettle);
        });
      } else {
        return BrewService.digital(kettle, element.pin, 0).then(function () {
          element.running = false;
          $scope.updateKnobCopy(kettle);
        }).catch(function (err) {
          return $scope.setErrorMessage(err, kettle);
        });
      }
    }
  };

  $scope.importSettings = function ($fileContent, $ext) {
    try {
      var profileContent = JSON.parse($fileContent);
      $scope.settings = profileContent.settings || BrewService.reset();
      $scope.kettles = profileContent.kettles || BrewService.defaultKettles();
    } catch (e) {
      // error importing
      $scope.setErrorMessage(e);
    }
  };

  $scope.exportSettings = function () {
    var kettles = angular.copy($scope.kettles);
    _.each(kettles, function (kettle, i) {
      kettles[i].values = [];
      kettles[i].active = false;
    });
    return "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ "settings": $scope.settings, "kettles": kettles }));
  };

  $scope.compileSketch = function (sketchName) {
    if (!$scope.settings.sensors) $scope.settings.sensors = {};
    // append esp type
    if (sketchName.indexOf('ESP') !== -1) sketchName += $scope.esp.type;
    var sketches = [];
    var arduinoName = '';
    _.each($scope.kettles, function (kettle, i) {
      arduinoName = kettle.arduino.url.replace(/[^a-zA-Z0-9-.]/g, "");
      var currentSketch = _.find(sketches, { name: arduinoName });
      if (!currentSketch) {
        sketches.push({
          name: arduinoName,
          actions: [],
          headers: [],
          triggers: false
        });
        currentSketch = _.find(sketches, { name: arduinoName });
      }
      var target = $scope.settings.general.unit == 'F' ? $filter('toCelsius')(kettle.temp.target) : kettle.temp.target;
      kettle.temp.adjust = parseFloat(kettle.temp.adjust);
      var adjust = $scope.settings.general.unit == 'F' && !!kettle.temp.adjust ? $filter('round')(kettle.temp.adjust * 0.555, 3) : kettle.temp.adjust;
      if (BrewService.isESP(kettle.arduino) && $scope.esp.autoconnect) {
        currentSketch.headers.push('#include <AutoConnect.h>');
      }
      if ((sketchName.indexOf('ESP') !== -1 || BrewService.isESP(kettle.arduino)) && ($scope.settings.sensors.DHT || kettle.temp.type.indexOf('DHT') !== -1) && currentSketch.headers.indexOf('#include "DHTesp.h"') === -1) {
        currentSketch.headers.push('// https://github.com/beegee-tokyo/DHTesp');
        currentSketch.headers.push('#include "DHTesp.h"');
      } else if (!BrewService.isESP(kettle.arduino) && ($scope.settings.sensors.DHT || kettle.temp.type.indexOf('DHT') !== -1) && currentSketch.headers.indexOf('#include <dht.h>') === -1) {
        currentSketch.headers.push('// https://www.brewbench.co/libs/DHTlib-1.2.9.zip');
        currentSketch.headers.push('#include <dht.h>');
      }
      if ($scope.settings.sensors.DS18B20 || kettle.temp.type.indexOf('DS18B20') !== -1) {
        if (currentSketch.headers.indexOf('#include <OneWire.h>') === -1) currentSketch.headers.push('#include <OneWire.h>');
        if (currentSketch.headers.indexOf('#include <DallasTemperature.h>') === -1) currentSketch.headers.push('#include <DallasTemperature.h>');
      }
      if ($scope.settings.sensors.BMP || kettle.temp.type.indexOf('BMP180') !== -1) {
        if (currentSketch.headers.indexOf('#include <Wire.h>') === -1) currentSketch.headers.push('#include <Wire.h>');
        if (currentSketch.headers.indexOf('#include <Adafruit_BMP085.h>') === -1) currentSketch.headers.push('#include <Adafruit_BMP085.h>');
      }
      // Are we using ADC?
      if (kettle.temp.pin.indexOf('C') === 0 && currentSketch.headers.indexOf('#include <Adafruit_ADS1015.h>') === -1) {
        currentSketch.headers.push('// https://github.com/adafruit/Adafruit_ADS1X15');
        if (currentSketch.headers.indexOf('#include <OneWire.h>') === -1) currentSketch.headers.push('#include <Wire.h>');
        if (currentSketch.headers.indexOf('#include <Adafruit_ADS1015.h>') === -1) currentSketch.headers.push('#include <Adafruit_ADS1015.h>');
      }
      var kettleType = kettle.temp.type;
      if (kettle.temp.vcc) kettleType += kettle.temp.vcc;
      if (kettle.temp.index) kettleType += '-' + kettle.temp.index;
      currentSketch.actions.push('actionsCommand(F("' + kettle.name.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + kettle.temp.pin + '"),F("' + kettleType + '"),' + adjust + ');');
      //look for triggers
      if (kettle.heater && kettle.heater.sketch) {
        currentSketch.triggers = true;
        currentSketch.actions.push('trigger(F("heat"),F("' + kettle.name.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + kettle.heater.pin + '"),temp,' + target + ',' + kettle.temp.diff + ',' + !!kettle.notify.slack + ');');
      }
      if (kettle.cooler && kettle.cooler.sketch) {
        currentSketch.triggers = true;
        currentSketch.actions.push('trigger(F("cool"),F("' + kettle.name.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + kettle.cooler.pin + '"),temp,' + target + ',' + kettle.temp.diff + ',' + !!kettle.notify.slack + ');');
      }
    });
    _.each(sketches, function (sketch, i) {
      if (sketch.triggers) {
        sketch.actions.unshift('float temp = 0.00;');
        // update autoCommand
        for (var a = 0; a < sketch.actions.length; a++) {
          if (sketches[i].actions[a].indexOf('actionsCommand(') !== -1) sketches[i].actions[a] = sketches[i].actions[a].replace('actionsCommand(', 'temp = actionsCommand(');
        }
      }
      downloadSketch(sketch.name, sketch.actions, sketch.triggers, sketch.headers, 'BrewBench' + sketchName);
    });
  };

  function downloadSketch(name, actions, hasTriggers, headers, sketch) {
    // tp link connection
    var tplink_connection_string = BrewService.tplink().connection();
    var autogen = '/* Sketch Auto Generated from http://monitor.brewbench.co on ' + moment().format('YYYY-MM-DD HH:MM:SS') + ' for ' + name + ' */\n';
    $http.get('assets/arduino/' + sketch + '/' + sketch + '.ino').then(function (response) {
      // replace variables
      response.data = autogen + response.data.replace('// [ACTIONS]', actions.length ? actions.join('\n') : '').replace('// [HEADERS]', headers.length ? headers.join('\n') : '').replace(/\[VERSION\]/g, $scope.pkg.sketch_version).replace(/\[TPLINK_CONNECTION\]/g, tplink_connection_string).replace(/\[SLACK_CONNECTION\]/g, $scope.settings.notifications.slack);

      if ($scope.esp.ssid) {
        response.data = response.data.replace(/\[SSID\]/g, $scope.esp.ssid);
      }
      if ($scope.esp.ssid_pass) {
        response.data = response.data.replace(/\[SSID_PASS\]/g, $scope.esp.ssid_pass);
      }
      if (sketch.indexOf('ESP') !== -1 && $scope.esp.hostname) {
        response.data = response.data.replace(/\[HOSTNAME\]/g, $scope.esp.hostname);
      } else if (sketch.indexOf('ESP') !== -1) {
        response.data = response.data.replace(/\[HOSTNAME\]/g, 'bbesp');
      } else {
        response.data = response.data.replace(/\[HOSTNAME\]/g, name);
      }
      if (sketch.indexOf('Streams') !== -1) {
        // streams connection
        var connection_string = 'https://' + $scope.settings.streams.username + '.streams.brewbench.co';
        response.data = response.data.replace(/\[STREAMS_CONNECTION\]/g, connection_string);
        response.data = response.data.replace(/\[STREAMS_AUTH\]/g, 'Authorization: Basic ' + btoa($scope.settings.streams.username.trim() + ':' + $scope.settings.streams.api_key.trim()));
      }if (sketch.indexOf('InfluxDB') !== -1) {
        // influx db connection
        var connection_string = '' + $scope.settings.influxdb.url;
        if ($scope.influxdb.brewbenchHosted()) {
          connection_string += '/bbp';
          if (sketch.indexOf('ESP') !== -1) {
            // does not support https
            if (connection_string.indexOf('https:') === 0) connection_string = connection_string.replace('https:', 'http:');
            response.data = response.data.replace(/\[INFLUXDB_AUTH\]/g, btoa($scope.settings.influxdb.user.trim() + ':' + $scope.settings.influxdb.pass.trim()));
            response.data = response.data.replace(/\[API_KEY\]/g, $scope.settings.influxdb.pass);
          } else {
            response.data = response.data.replace(/\[INFLUXDB_AUTH\]/g, 'Authorization: Basic ' + btoa($scope.settings.influxdb.user.trim() + ':' + $scope.settings.influxdb.pass.trim()));
            var additional_post_params = '  p.addParameter(F("-H"));\n';
            additional_post_params += '  p.addParameter(F("X-API-KEY: ' + $scope.settings.influxdb.pass + '"));';
            response.data = response.data.replace('// additional_post_params', additional_post_params);
          }
        } else {
          if (!!$scope.settings.influxdb.port) connection_string += ':' + $scope.settings.influxdb.port;
          connection_string += '/write?';
          // add user/pass
          if (!!$scope.settings.influxdb.user && !!$scope.settings.influxdb.pass) connection_string += 'u=' + $scope.settings.influxdb.user + '&p=' + $scope.settings.influxdb.pass + '&';
          // add db
          connection_string += 'db=' + ($scope.settings.influxdb.db || 'session-' + moment().format('YYYY-MM-DD'));
          response.data = response.data.replace(/\[INFLUXDB_AUTH\]/g, '');
        }
        response.data = response.data.replace(/\[INFLUXDB_CONNECTION\]/g, connection_string);
      }
      if (headers.indexOf('#include <dht.h>') !== -1 || headers.indexOf('#include "DHTesp.h"') !== -1) {
        response.data = response.data.replace(/\/\/ DHT /g, '');
      }
      if (headers.indexOf('#include <DallasTemperature.h>') !== -1) {
        response.data = response.data.replace(/\/\/ DS18B20 /g, '');
      }
      if (headers.indexOf('#include <Adafruit_ADS1015.h>') !== -1) {
        response.data = response.data.replace(/\/\/ ADC /g, '');
      }
      if (headers.indexOf('#include <Adafruit_BMP085.h>') !== -1) {
        response.data = response.data.replace(/\/\/ BMP180 /g, '');
      }
      if (hasTriggers) {
        response.data = response.data.replace(/\/\/ triggers /g, '');
      }
      var streamSketch = document.createElement('a');
      streamSketch.setAttribute('download', sketch + '-' + name + '.ino');
      streamSketch.setAttribute('href', "data:text/ino;charset=utf-8," + encodeURIComponent(response.data));
      streamSketch.style.display = 'none';
      document.body.appendChild(streamSketch);
      streamSketch.click();
      document.body.removeChild(streamSketch);
    }).catch(function (err) {
      $scope.setErrorMessage('Failed to download sketch ' + err.message);
    });
  }

  $scope.getIPAddress = function () {
    $scope.settings.ipAddress = "";
    BrewService.ip().then(function (response) {
      $scope.settings.ipAddress = response.ip;
    }).catch(function (err) {
      $scope.setErrorMessage(err);
    });
  };

  $scope.notify = function (kettle, timer) {

    //don't start alerts until we have hit the temp.target
    if (!timer && kettle && !kettle.temp.hit || $scope.settings.notifications.on === false) {
      return;
    }
    var date = new Date();
    // Desktop / Slack Notification
    var message,
        icon = '/assets/img/brewbench-logo.png',
        color = 'good';

    if (kettle && ['hop', 'grain', 'water', 'fermenter'].indexOf(kettle.type) !== -1) icon = '/assets/img/' + kettle.type + '.png';

    //don't alert if the heater is running and temp is too low
    if (kettle && kettle.low && kettle.heater.running) return;

    var currentValue = kettle && kettle.temp ? kettle.temp.current : 0;
    var unitType = '\xB0';
    //percent?
    if (kettle && !!BrewService.sensorTypes(kettle.temp.type).percent && typeof kettle.percent != 'undefined') {
      currentValue = kettle.percent;
      unitType = '%';
    } else if (kettle) {
      kettle.values.push([date.getTime(), currentValue]);
    }

    if (!!timer) {
      //kettle is a timer object
      if (!$scope.settings.notifications.timers) return;
      if (timer.up) message = 'Your timers are done';else if (!!timer.notes) message = 'Time to add ' + timer.notes + ' of ' + timer.label;else message = 'Time to add ' + timer.label;
    } else if (kettle && kettle.high) {
      if (!$scope.settings.notifications.high || $scope.settings.notifications.last == 'high') return;
      message = kettle.name + ' is ' + $filter('round')(kettle.high - kettle.temp.diff, 0) + unitType + ' high';
      color = 'danger';
      $scope.settings.notifications.last = 'high';
    } else if (kettle && kettle.low) {
      if (!$scope.settings.notifications.low || $scope.settings.notifications.last == 'low') return;
      message = kettle.name + ' is ' + $filter('round')(kettle.low - kettle.temp.diff, 0) + unitType + ' low';
      color = '#3498DB';
      $scope.settings.notifications.last = 'low';
    } else if (kettle) {
      if (!$scope.settings.notifications.target || $scope.settings.notifications.last == 'target') return;
      message = kettle.name + ' is within the target at ' + currentValue + unitType;
      color = 'good';
      $scope.settings.notifications.last = 'target';
    } else if (!kettle) {
      message = 'Testing Alerts, you are ready to go, click play on a kettle.';
    }

    // Mobile Vibrate Notification
    if ("vibrate" in navigator) {
      navigator.vibrate([500, 300, 500]);
    }

    // Sound Notification
    if ($scope.settings.sounds.on === true) {
      //don't alert if the heater is running and temp is too low
      if (!!timer && kettle && kettle.low && kettle.heater.running) return;
      var snd = new Audio(!!timer ? $scope.settings.sounds.timer : $scope.settings.sounds.alert); // buffers automatically when created
      snd.play();
    }

    // Window Notification
    if ("Notification" in window) {
      //close the measured notification
      if (notification) notification.close();

      if (Notification.permission === "granted") {
        if (message) {
          if (kettle) notification = new Notification(kettle.name + ' kettle', { body: message, icon: icon });else notification = new Notification('Test kettle', { body: message, icon: icon });
        }
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {
          // If the user accepts, let's create a notification
          if (permission === "granted") {
            if (message) {
              notification = new Notification(kettle.name + ' kettle', { body: message, icon: icon });
            }
          }
        });
      }
    }
    // Slack Notification
    if ($scope.settings.notifications.slack.indexOf('http') === 0) {
      BrewService.slack($scope.settings.notifications.slack, message, color, icon, kettle).then(function (response) {
        $scope.resetError();
      }).catch(function (err) {
        if (err.message) $scope.setErrorMessage('Failed posting to Slack ' + err.message);else $scope.setErrorMessage('Failed posting to Slack ' + JSON.stringify(err));
      });
    }
  };

  $scope.updateKnobCopy = function (kettle) {

    if (!kettle.active) {
      kettle.knob.trackColor = '#ddd';
      kettle.knob.barColor = '#777';
      kettle.knob.subText.text = 'not running';
      kettle.knob.subText.color = 'gray';
      return;
    } else if (kettle.message.message && kettle.message.type == 'danger') {
      kettle.knob.trackColor = '#ddd';
      kettle.knob.barColor = '#777';
      kettle.knob.subText.text = 'error';
      kettle.knob.subText.color = 'gray';
      return;
    }
    var currentValue = kettle.temp.current;
    var unitType = '\xB0';
    //percent?
    if (!!BrewService.sensorTypes(kettle.temp.type).percent && typeof kettle.percent != 'undefined') {
      currentValue = kettle.percent;
      unitType = '%';
    }
    //is currentValue too high?
    if (currentValue > kettle.temp.target + kettle.temp.diff) {
      kettle.knob.barColor = 'rgba(255,0,0,.6)';
      kettle.knob.trackColor = 'rgba(255,0,0,.1)';
      kettle.high = currentValue - kettle.temp.target;
      kettle.low = null;
      if (kettle.cooler && kettle.cooler.running) {
        kettle.knob.subText.text = 'cooling';
        kettle.knob.subText.color = 'rgba(52,152,219,1)';
      } else {
        //update knob text
        kettle.knob.subText.text = $filter('round')(kettle.high - kettle.temp.diff, 0) + unitType + ' high';
        kettle.knob.subText.color = 'rgba(255,0,0,.6)';
      }
    } else if (currentValue < kettle.temp.target - kettle.temp.diff) {
      kettle.knob.barColor = 'rgba(52,152,219,.5)';
      kettle.knob.trackColor = 'rgba(52,152,219,.1)';
      kettle.low = kettle.temp.target - currentValue;
      kettle.high = null;
      if (kettle.heater.running) {
        kettle.knob.subText.text = 'heating';
        kettle.knob.subText.color = 'rgba(255,0,0,.6)';
      } else {
        //update knob text
        kettle.knob.subText.text = $filter('round')(kettle.low - kettle.temp.diff, 0) + unitType + ' low';
        kettle.knob.subText.color = 'rgba(52,152,219,1)';
      }
    } else {
      kettle.knob.barColor = 'rgba(44,193,133,.6)';
      kettle.knob.trackColor = 'rgba(44,193,133,.1)';
      kettle.knob.subText.text = 'within target';
      kettle.knob.subText.color = 'gray';
      kettle.low = null;
      kettle.high = null;
    }
  };

  $scope.changeKettleType = function (kettle) {
    //don't allow changing kettles on shared sessions
    //this could be dangerous if doing this remotely
    if ($scope.settings.general.shared) return;
    // find current kettle
    var kettleIndex = _.findIndex($scope.kettleTypes, { type: kettle.type });
    // move to next or first kettle in array
    kettleIndex++;
    var kettleType = $scope.kettleTypes[kettleIndex] ? $scope.kettleTypes[kettleIndex] : $scope.kettleTypes[0];
    //update kettle options if changed
    kettle.name = kettleType.name;
    kettle.type = kettleType.type;
    kettle.temp.target = kettleType.target;
    kettle.temp.diff = kettleType.diff;
    kettle.knob = angular.copy(BrewService.defaultKnobOptions(), { value: kettle.temp.current, min: 0, max: kettleType.target + kettleType.diff });
    if (kettleType.type == 'fermenter' || kettleType.type == 'air') {
      kettle.cooler = { pin: 'D2', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false };
      delete kettle.pump;
    } else {
      kettle.pump = { pin: 'D2', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false };
      delete kettle.cooler;
    }
    $scope.updateStreams(kettle);
  };

  $scope.changeUnits = function (unit) {
    if ($scope.settings.general.unit != unit) {
      $scope.settings.general.unit = unit;
      _.each($scope.kettles, function (kettle) {
        kettle.temp.target = parseFloat(kettle.temp.target);
        kettle.temp.current = parseFloat(kettle.temp.current);
        kettle.temp.current = $filter('formatDegrees')(kettle.temp.current, unit);
        kettle.temp.measured = $filter('formatDegrees')(kettle.temp.measured, unit);
        kettle.temp.previous = $filter('formatDegrees')(kettle.temp.previous, unit);
        kettle.temp.target = $filter('formatDegrees')(kettle.temp.target, unit);
        kettle.temp.target = $filter('round')(kettle.temp.target, 0);
        if (!!kettle.temp.adjust) {
          kettle.temp.adjust = parseFloat(kettle.temp.adjust);
          if (unit === 'C') kettle.temp.adjust = $filter('round')(kettle.temp.adjust * 0.555, 3);else kettle.temp.adjust = $filter('round')(kettle.temp.adjust * 1.8, 0);
        }
        // update chart values
        if (kettle.values.length) {
          _.each(kettle.values, function (v, i) {
            kettle.values[i] = [kettle.values[i][0], $filter('formatDegrees')(kettle.values[i][1], unit)];
          });
        }
        // update knob
        kettle.knob.value = kettle.temp.current;
        kettle.knob.max = kettle.temp.target + kettle.temp.diff + 10;
        $scope.updateKnobCopy(kettle);
      });
      $scope.chartOptions = BrewService.chartOptions({ unit: $scope.settings.general.unit, chart: $scope.settings.chart, session: $scope.settings.streams.session });
    }
  };

  $scope.timerRun = function (timer, kettle) {
    return $interval(function () {
      //cancel interval if zero out
      if (!timer.up && timer.min == 0 && timer.sec == 0) {
        //stop running
        timer.running = false;
        //start up counter
        timer.up = { min: 0, sec: 0, running: true };
        //if all timers are done send an alert
        if (!!kettle && _.filter(kettle.timers, { up: { running: true } }).length == kettle.timers.length) $scope.notify(kettle, timer);
      } else if (!timer.up && timer.sec > 0) {
        //count down seconds
        timer.sec--;
      } else if (timer.up && timer.up.sec < 59) {
        //count up seconds
        timer.up.sec++;
      } else if (!timer.up) {
        //should we start the next timer?
        if (!!kettle) {
          _.each(_.filter(kettle.timers, { running: false, min: timer.min, queue: false }), function (nextTimer) {
            $scope.notify(kettle, nextTimer);
            nextTimer.queue = true;
            $timeout(function () {
              $scope.timerStart(nextTimer, kettle);
            }, 60000);
          });
        }
        //cound down minutes and seconds
        timer.sec = 59;
        timer.min--;
      } else if (timer.up) {
        //cound up minutes and seconds
        timer.up.sec = 0;
        timer.up.min++;
      }
    }, 1000);
  };

  $scope.timerStart = function (timer, kettle) {
    if (timer.up && timer.up.running) {
      //stop timer
      timer.up.running = false;
      $interval.cancel(timer.interval);
    } else if (timer.running) {
      //stop timer
      timer.running = false;
      $interval.cancel(timer.interval);
    } else {
      //start timer
      timer.running = true;
      timer.queue = false;
      timer.interval = $scope.timerRun(timer, kettle);
    }
  };

  $scope.processTemps = function () {
    var allSensors = [];
    var date = new Date();
    //only process active sensors
    _.each($scope.kettles, function (k, i) {
      if ($scope.kettles[i].active) {
        allSensors.push(BrewService.temp($scope.kettles[i]).then(function (response) {
          return $scope.updateTemp(response, $scope.kettles[i]);
        }).catch(function (err) {
          // udpate chart with current
          kettle.values.push([date.getTime(), kettle.temp.current]);
          if ($scope.kettles[i].error.count) $scope.kettles[i].error.count++;else $scope.kettles[i].error.count = 1;
          if ($scope.kettles[i].error.count == 7) {
            $scope.kettles[i].error.count = 0;
            $scope.setErrorMessage(err, $scope.kettles[i]);
          }
          return err;
        }));
      }
    });

    return $q.all(allSensors).then(function (values) {
      //re process on timeout
      $timeout(function () {
        return $scope.processTemps();
      }, !!$scope.settings.pollSeconds ? $scope.settings.pollSeconds * 1000 : 10000);
    }).catch(function (err) {
      $timeout(function () {
        return $scope.processTemps();
      }, !!$scope.settings.pollSeconds ? $scope.settings.pollSeconds * 1000 : 10000);
    });
  };

  $scope.removeKettle = function (kettle, $index) {
    $scope.updateStreams(kettle);
    $scope.kettles.splice($index, 1);
  };

  $scope.changeValue = function (kettle, field, up) {

    if (timeout) $timeout.cancel(timeout);

    if (up) kettle.temp[field]++;else kettle.temp[field]--;

    if (field == 'adjust') {
      kettle.temp.current = parseFloat(kettle.temp.measured) + parseFloat(kettle.temp.adjust);
    }

    //update knob after 1 seconds, otherwise we get a lot of refresh on the knob when clicking plus or minus
    timeout = $timeout(function () {
      //update max
      kettle.knob.max = kettle.temp['target'] + kettle.temp['diff'] + 10;
      $scope.updateKnobCopy(kettle);
      $scope.updateStreams(kettle);
    }, 1000);
  };

  $scope.updateStreams = function (kettle) {
    //update streams
    if ($scope.streams.connected() && kettle.notify.streams) {
      $scope.streams.kettles(kettle);
    }
  };

  $scope.loadConfig() // load config
  .then($scope.init) // init
  .then(function (loaded) {
    if (!!loaded) $scope.processTemps(); // start polling
  });

  // update local cache
  $scope.updateLocal = function () {
    $timeout(function () {
      BrewService.settings('settings', $scope.settings);
      BrewService.settings('kettles', $scope.kettles);
      $scope.updateLocal();
    }, 5000);
  };
  $scope.updateLocal();
});
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(63)))

/***/ }),

/***/ 544:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


angular.module('brewbench-monitor').directive('editable', function () {
    return {
        restrict: 'E',
        scope: { model: '=', type: '@?', trim: '@?', change: '&?', enter: '&?', placeholder: '@?' },
        replace: false,
        template: '<span>' + '<input type="{{type}}" ng-model="model" ng-show="edit" ng-enter="edit=false" ng-change="{{change||false}}" class="editable"></input>' + '<span class="editable" ng-show="!edit">{{(trim) ? ((type=="password") ? "*******" : ((model || placeholder) | limitTo:trim)+"...") :' + ' ((type=="password") ? "*******" : (model || placeholder))}}</span>' + '</span>',
        link: function link(scope, element, attrs) {
            scope.edit = false;
            scope.type = !!scope.type ? scope.type : 'text';
            element.bind('click', function () {
                scope.$apply(scope.edit = true);
            });
            if (scope.enter) scope.enter();
        }
    };
}).directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind('keypress', function (e) {
            if (e.charCode === 13 || e.keyCode === 13) {
                scope.$apply(attrs.ngEnter);
                if (scope.change) scope.$apply(scope.change);
            }
        });
    };
}).directive('onReadFile', function ($parse) {
    return {
        restrict: 'A',
        scope: false,
        link: function link(scope, element, attrs) {
            var fn = $parse(attrs.onReadFile);

            element.on('change', function (onChangeEvent) {
                var reader = new FileReader();
                var file = (onChangeEvent.srcElement || onChangeEvent.target).files[0];
                var extension = file ? file.name.split('.').pop().toLowerCase() : '';

                reader.onload = function (onLoadEvent) {
                    scope.$apply(function () {
                        fn(scope, { $fileContent: onLoadEvent.target.result, $ext: extension });
                        element.val(null);
                    });
                };
                reader.readAsText(file);
            });
        }
    };
});

/***/ }),

/***/ 545:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


angular.module('brewbench-monitor').filter('moment', function () {
  return function (date, format) {
    if (!date) return '';
    if (format) return moment(new Date(date)).format(format);else return moment(new Date(date)).fromNow();
  };
}).filter('formatDegrees', function ($filter) {
  return function (temp, unit) {
    if (unit == 'F') return $filter('toFahrenheit')(temp);else return $filter('toCelsius')(temp);
  };
}).filter('toFahrenheit', function ($filter) {
  return function (celsius) {
    celsius = parseFloat(celsius);
    return $filter('round')(celsius * 9 / 5 + 32, 2);
  };
}).filter('toCelsius', function ($filter) {
  return function (fahrenheit) {
    fahrenheit = parseFloat(fahrenheit);
    return $filter('round')((fahrenheit - 32) * 5 / 9, 2);
  };
}).filter('round', function ($filter) {
  return function (val, decimals) {
    return Number(Math.round(val + "e" + decimals) + "e-" + decimals);
  };
}).filter('highlight', function ($sce) {
  return function (text, phrase) {
    if (text && phrase) {
      text = text.replace(new RegExp('(' + phrase + ')', 'gi'), '<span class="highlighted">$1</span>');
    } else if (!text) {
      text = '';
    }
    return $sce.trustAsHtml(text.toString());
  };
}).filter('titlecase', function ($filter) {
  return function (text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  };
});

/***/ }),

/***/ 546:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(jQuery) {

angular.module('brewbench-monitor').factory('BrewService', function ($http, $q, $filter) {

  return {

    //cookies size 4096 bytes
    clear: function clear() {
      if (window.localStorage) {
        window.localStorage.removeItem('settings');
        window.localStorage.removeItem('kettles');
        window.localStorage.removeItem('share');
        window.localStorage.removeItem('accessToken');
      }
    },
    accessToken: function accessToken(token) {
      if (token) return window.localStorage.setItem('accessToken', token);else return window.localStorage.getItem('accessToken');
    },
    reset: function reset() {
      var defaultSettings = {
        general: { debug: false, pollSeconds: 10, unit: 'F', shared: false },
        chart: { show: true, military: false, area: false },
        sensors: { DHT: false, DS18B20: false, BMP: false },
        recipe: { 'name': '', 'brewer': { name: '', 'email': '' }, 'yeast': [], 'hops': [], 'grains': [], scale: 'gravity', method: 'papazian', 'og': 1.050, 'fg': 1.010, 'abv': 0, 'abw': 0, 'calories': 0, 'attenuation': 0 },
        notifications: { on: true, timers: true, high: true, low: true, target: true, slack: '', last: '' },
        sounds: { on: true, alert: '/assets/audio/bike.mp3', timer: '/assets/audio/school.mp3' },
        arduinos: [{ id: 'local-' + btoa('brewbench'), board: '', url: 'arduino.local', analog: 5, digital: 13, adc: 0, secure: false, version: '', status: { error: '', dt: '', message: '' } }],
        tplink: { user: '', pass: '', token: '', status: '', plugs: [] },
        influxdb: { url: '', port: '', user: '', pass: '', db: '', dbs: [], status: '' },
        streams: { username: '', api_key: '', status: '', session: { id: '', name: '', type: 'fermentation' } }
      };
      return defaultSettings;
    },

    defaultKnobOptions: function defaultKnobOptions() {
      return {
        readOnly: true,
        unit: '\xB0',
        subText: {
          enabled: true,
          text: '',
          color: 'gray',
          font: 'auto'
        },
        trackWidth: 40,
        barWidth: 25,
        barCap: 25,
        trackColor: '#ddd',
        barColor: '#777',
        dynamicOptions: true,
        displayPrevious: true,
        prevBarColor: '#777'
      };
    },

    defaultKettles: function defaultKettles() {
      return [{
        name: 'Hot Liquor',
        id: null,
        type: 'water',
        active: false,
        sticky: false,
        heater: { pin: 'D2', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        pump: { pin: 'D3', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        temp: { pin: 'A0', vcc: '', index: '', type: 'Thermistor', adc: false, hit: false, current: 0, measured: 0, previous: 0, adjust: 0, target: 170, diff: 2, raw: 0, volts: 0 },
        values: [],
        timers: [],
        knob: angular.copy(this.defaultKnobOptions(), { value: 0, min: 0, max: 220 }),
        arduino: { id: 'local-' + btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13, adc: 0, secure: false },
        message: { type: 'error', message: '', version: '', count: 0, location: '' },
        notify: { slack: false, dweet: false, streams: false }
      }, {
        name: 'Mash',
        id: null,
        type: 'grain',
        active: false,
        sticky: false,
        heater: { pin: 'D4', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        pump: { pin: 'D5', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        temp: { pin: 'A1', vcc: '', index: '', type: 'Thermistor', adc: false, hit: false, current: 0, measured: 0, previous: 0, adjust: 0, target: 152, diff: 2, raw: 0, volts: 0 },
        values: [],
        timers: [],
        knob: angular.copy(this.defaultKnobOptions(), { value: 0, min: 0, max: 220 }),
        arduino: { id: 'local-' + btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13, adc: 0, secure: false },
        message: { type: 'error', message: '', version: '', count: 0, location: '' },
        notify: { slack: false, dweet: false, streams: false }
      }, {
        name: 'Boil',
        id: null,
        type: 'hop',
        active: false,
        sticky: false,
        heater: { pin: 'D6', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        pump: { pin: 'D7', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        temp: { pin: 'A2', vcc: '', index: '', type: 'Thermistor', adc: false, hit: false, current: 0, measured: 0, previous: 0, adjust: 0, target: 200, diff: 2, raw: 0, volts: 0 },
        values: [],
        timers: [],
        knob: angular.copy(this.defaultKnobOptions(), { value: 0, min: 0, max: 220 }),
        arduino: { id: 'local-' + btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13, adc: 0, secure: false },
        message: { type: 'error', message: '', version: '', count: 0, location: '' },
        notify: { slack: false, dweet: false, streams: false }
      }];
    },

    settings: function settings(key, values) {
      if (!window.localStorage) return values;
      try {
        if (values) {
          return window.localStorage.setItem(key, JSON.stringify(values));
        } else if (window.localStorage.getItem(key)) {
          return JSON.parse(window.localStorage.getItem(key));
        } else if (key == 'settings') {
          return this.reset();
        }
      } catch (e) {
        /*JSON parse error*/
      }
      return values;
    },

    sensorTypes: function sensorTypes(name) {
      var sensors = [{ name: 'Thermistor', analog: true, digital: false, esp: true }, { name: 'DS18B20', analog: false, digital: true, esp: true }, { name: 'PT100', analog: true, digital: true, esp: true }, { name: 'DHT11', analog: false, digital: true, esp: true }, { name: 'DHT12', analog: false, digital: true, esp: false }, { name: 'DHT21', analog: false, digital: true, esp: false }, { name: 'DHT22', analog: false, digital: true, esp: true }, { name: 'DHT33', analog: false, digital: true, esp: false }, { name: 'DHT44', analog: false, digital: true, esp: false }, { name: 'SoilMoisture', analog: true, digital: false, vcc: true, percent: true, esp: true }, { name: 'BMP180', analog: true, digital: false, esp: true }];
      if (name) return _.filter(sensors, { 'name': name })[0];
      return sensors;
    },

    kettleTypes: function kettleTypes(type) {
      var kettles = [{ 'name': 'Boil', 'type': 'hop', 'target': 200, 'diff': 2 }, { 'name': 'Mash', 'type': 'grain', 'target': 152, 'diff': 2 }, { 'name': 'Hot Liquor', 'type': 'water', 'target': 170, 'diff': 2 }, { 'name': 'Fermenter', 'type': 'fermenter', 'target': 74, 'diff': 2 }, { 'name': 'Temp', 'type': 'air', 'target': 74, 'diff': 2 }, { 'name': 'Soil', 'type': 'leaf', 'target': 60, 'diff': 2 }];
      if (type) return _.filter(kettles, { 'type': type })[0];
      return kettles;
    },

    domain: function domain(arduino) {
      var settings = this.settings('settings');
      var domain = 'http://arduino.local';

      if (arduino && arduino.url) {
        domain = arduino.url.indexOf('//') !== -1 ? arduino.url.substr(arduino.url.indexOf('//') + 2) : arduino.url;

        if (!!arduino.secure) domain = 'https://' + domain;else domain = 'http://' + domain;
      }

      return domain;
    },

    isESP: function isESP(arduino) {
      return !!(arduino.board && (arduino.board.toLowerCase().indexOf('esp') !== -1 || arduino.board.toLowerCase().indexOf('nodemcu') !== -1));
    },

    slack: function slack(webhook_url, msg, color, icon, kettle) {
      var q = $q.defer();

      var postObj = { 'attachments': [{ 'fallback': msg,
          'title': kettle.name,
          'title_link': 'http://' + document.location.host,
          'fields': [{ 'value': msg }],
          'color': color,
          'mrkdwn_in': ['text', 'fallback', 'fields'],
          'thumb_url': icon
        }]
      };

      $http({ url: webhook_url, method: 'POST', data: 'payload=' + JSON.stringify(postObj), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).then(function (response) {
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    connect: function connect(arduino) {
      var q = $q.defer();
      var url = this.domain(arduino) + '/arduino/info';
      var settings = this.settings('settings');
      var request = { url: url, method: 'GET', timeout: settings.general.pollSeconds * 10000 };
      $http(request).then(function (response) {
        if (response.headers('X-Sketch-Version')) response.data.sketch_version = response.headers('X-Sketch-Version');
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },
    // Thermistor, DS18B20, or PT100
    // https://learn.adafruit.com/thermistor/using-a-thermistor
    // https://www.adafruit.com/product/381)
    // https://www.adafruit.com/product/3290 and https://www.adafruit.com/product/3328
    temp: function temp(kettle) {
      if (!kettle.arduino) return $q.reject('Select an arduino to use.');
      var q = $q.defer();
      var url = this.domain(kettle.arduino) + '/arduino/' + kettle.temp.type;
      if (this.isESP(kettle.arduino)) {
        if (kettle.temp.pin.indexOf('A') === 0) url += '?apin=' + kettle.temp.pin;else url += '?dpin=' + kettle.temp.pin;
        if (!!kettle.temp.vcc) //SoilMoisture logic
          url += '&dpin=' + kettle.temp.vcc;else if (!!kettle.temp.index) //DS18B20 logic
          url += '&index=' + kettle.temp.index;
      } else {
        if (!!kettle.temp.vcc) //SoilMoisture logic
          url += kettle.temp.vcc;else if (!!kettle.temp.index) //DS18B20 logic
          url += '&index=' + kettle.temp.index;
        url += '/' + kettle.temp.pin;
      }
      var settings = this.settings('settings');
      var request = { url: url, method: 'GET', timeout: settings.general.pollSeconds * 10000 };

      if (kettle.arduino.password) {
        request.withCredentials = true;
        request.headers = { 'Authorization': 'Basic ' + btoa('root:' + kettle.arduino.password.trim()) };
      }

      $http(request).then(function (response) {
        response.data.sketch_version = response.headers('X-Sketch-Version');
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },
    // read/write heater
    // http://arduinotronics.blogspot.com/2013/01/working-with-sainsmart-5v-relay-board.html
    // http://myhowtosandprojects.blogspot.com/2014/02/sainsmart-2-channel-5v-relay-arduino.html
    digital: function digital(kettle, sensor, value) {
      if (!kettle.arduino) return $q.reject('Select an arduino to use.');
      var q = $q.defer();
      var url = this.domain(kettle.arduino) + '/arduino/digital';
      if (this.isESP(kettle.arduino)) {
        url += '?dpin=' + sensor + '&value=' + value;
      } else {
        url += '/' + sensor + '/' + value;
      }
      var settings = this.settings('settings');
      var request = { url: url, method: 'GET', timeout: settings.general.pollSeconds * 10000 };

      if (kettle.arduino.password) {
        request.withCredentials = true;
        request.headers = { 'Authorization': 'Basic ' + btoa('root:' + kettle.arduino.password.trim()) };
      }

      $http(request).then(function (response) {
        response.data.sketch_version = response.headers('X-Sketch-Version');
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    analog: function analog(kettle, sensor, value) {
      if (!kettle.arduino) return $q.reject('Select an arduino to use.');
      var q = $q.defer();
      var url = this.domain(kettle.arduino) + '/arduino/analog';
      if (this.isESP(kettle.arduino)) {
        url += '?apin=' + sensor + '&value=' + value;
      } else {
        url += '/' + sensor + '/' + value;
      }
      var settings = this.settings('settings');
      var request = { url: url, method: 'GET', timeout: settings.general.pollSeconds * 10000 };

      if (kettle.arduino.password) {
        request.withCredentials = true;
        request.headers = { 'Authorization': 'Basic ' + btoa('root:' + kettle.arduino.password.trim()) };
      }

      $http(request).then(function (response) {
        response.data.sketch_version = response.headers('X-Sketch-Version');
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    digitalRead: function digitalRead(kettle, sensor, timeout) {
      if (!kettle.arduino) return $q.reject('Select an arduino to use.');
      var q = $q.defer();
      var url = this.domain(kettle.arduino) + '/arduino/digital';
      if (this.isESP(kettle.arduino)) {
        url += '?dpin=' + sensor;
      } else {
        url += '/' + sensor;
      }
      var settings = this.settings('settings');
      var request = { url: url, method: 'GET', timeout: settings.general.pollSeconds * 10000 };

      if (kettle.arduino.password) {
        request.withCredentials = true;
        request.headers = { 'Authorization': 'Basic ' + btoa('root:' + kettle.arduino.password.trim()) };
      }

      $http(request).then(function (response) {
        response.data.sketch_version = response.headers('X-Sketch-Version');
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    loadShareFile: function loadShareFile(file, password) {
      var q = $q.defer();
      var query = '';
      if (password) query = '?password=' + md5(password);
      $http({ url: 'https://monitor.brewbench.co/share/get/' + file + query, method: 'GET' }).then(function (response) {
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    // TODO finish this
    // deleteShareFile: function(file, password){
    //   var q = $q.defer();
    //   $http({url: 'https://monitor.brewbench.co/share/delete/'+file, method: 'GET'})
    //     .then(response => {
    //       q.resolve(response.data);
    //     })
    //     .catch(err => {
    //       q.reject(err);
    //     });
    //   return q.promise;
    // },

    createShare: function createShare(share) {
      var q = $q.defer();
      var settings = this.settings('settings');
      var kettles = this.settings('kettles');
      var sh = Object.assign({}, { password: share.password, access: share.access });
      //remove some things we don't need to share
      _.each(kettles, function (kettle, i) {
        delete kettles[i].knob;
        delete kettles[i].values;
      });
      delete settings.streams;
      delete settings.influxdb;
      delete settings.tplink;
      delete settings.notifications;
      delete settings.sketches;
      settings.shared = true;
      if (sh.password) sh.password = md5(sh.password);
      $http({ url: 'https://monitor.brewbench.co/share/create/',
        method: 'POST',
        data: { 'share': sh, 'settings': settings, 'kettles': kettles },
        headers: { 'Content-Type': 'application/json' }
      }).then(function (response) {
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    shareTest: function shareTest(arduino) {
      var q = $q.defer();
      var query = 'url=' + arduino.url;

      if (arduino.password) query += '&auth=' + btoa('root:' + arduino.password.trim());

      $http({ url: 'https://monitor.brewbench.co/share/test/?' + query, method: 'GET' }).then(function (response) {
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    ip: function ip(arduino) {
      var q = $q.defer();

      $http({ url: 'https://monitor.brewbench.co/share/ip', method: 'GET' }).then(function (response) {
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    dweet: function dweet() {
      return {
        latest: function latest() {
          var q = $q.defer();
          $http({ url: 'https://dweet.io/get/latest/dweet/for/brewbench', method: 'GET' }).then(function (response) {
            q.resolve(response.data);
          }).catch(function (err) {
            q.reject(err);
          });
          return q.promise;
        },
        all: function all() {
          var q = $q.defer();
          $http({ url: 'https://dweet.io/get/dweets/for/brewbench', method: 'GET' }).then(function (response) {
            q.resolve(response.data);
          }).catch(function (err) {
            q.reject(err);
          });
          return q.promise;
        }
      };
    },

    tplink: function tplink() {
      var _this = this;

      var url = "https://wap.tplinkcloud.com";
      var params = {
        appName: 'Kasa_Android',
        termID: 'BrewBench',
        appVer: '1.4.4.607',
        ospf: 'Android+6.0.1',
        netType: 'wifi',
        locale: 'es_EN'
      };
      return {
        connection: function connection() {
          var settings = _this.settings('settings');
          if (settings.tplink.token) {
            params.token = settings.tplink.token;
            return url + '/?' + jQuery.param(params);
          }
          return '';
        },
        login: function login(user, pass) {
          var q = $q.defer();
          if (!user || !pass) return q.reject('Invalid Login');
          var login_payload = {
            "method": "login",
            "url": url,
            "params": {
              "appType": "Kasa_Android",
              "cloudPassword": pass,
              "cloudUserName": user,
              "terminalUUID": params.termID
            }
          };
          $http({ url: url,
            method: 'POST',
            params: params,
            data: JSON.stringify(login_payload),
            headers: { 'Content-Type': 'application/json' }
          }).then(function (response) {
            // save the token
            if (response.data.result) {
              q.resolve(response.data.result);
            } else {
              q.reject(response.data);
            }
          }).catch(function (err) {
            q.reject(err);
          });
          return q.promise;
        },
        scan: function scan(token) {
          var q = $q.defer();
          var settings = _this.settings('settings');
          token = token || settings.tplink.token;
          if (!token) return q.reject('Invalid token');
          $http({ url: url,
            method: 'POST',
            params: { token: token },
            data: JSON.stringify({ method: "getDeviceList" }),
            headers: { 'Content-Type': 'application/json' }
          }).then(function (response) {
            q.resolve(response.data.result);
          }).catch(function (err) {
            q.reject(err);
          });
          return q.promise;
        },
        command: function command(device, _command) {
          var q = $q.defer();
          var settings = _this.settings('settings');
          var token = settings.tplink.token;
          var payload = {
            "method": "passthrough",
            "params": {
              "deviceId": device.deviceId,
              "requestData": JSON.stringify(_command)
            }
          };
          // set the token
          if (!token) return q.reject('Invalid token');
          params.token = token;
          $http({ url: device.appServerUrl,
            method: 'POST',
            params: params,
            data: JSON.stringify(payload),
            headers: { 'Cache-Control': 'no-cache', 'Content-Type': 'application/json' }
          }).then(function (response) {
            q.resolve(response.data.result);
          }).catch(function (err) {
            q.reject(err);
          });
          return q.promise;
        },
        toggle: function toggle(device, _toggle) {
          var command = { "system": { "set_relay_state": { "state": _toggle } } };
          return _this.tplink().command(device, command);
        },
        info: function info(device) {
          var command = { "system": { "get_sysinfo": null }, "emeter": { "get_realtime": null } };
          return _this.tplink().command(device, command);
        }
      };
    },

    streams: function streams() {
      var _this2 = this;

      var settings = this.settings('settings');
      var request = { url: 'http://localhost:3001/api', headers: {}, timeout: settings.general.pollSeconds * 10000 };

      return {
        auth: async function auth(ping) {
          var q = $q.defer();
          if (settings.streams.api_key && settings.streams.username) {
            request.url += ping ? '/users/ping' : '/users/auth';
            request.method = 'POST';
            request.headers['Content-Type'] = 'application/json';
            request.headers['X-API-Key'] = '' + settings.streams.api_key;
            request.headers['X-BB-User'] = '' + settings.streams.username;
            $http(request).then(function (response) {
              if (response && response.data && response.data.access && response.data.access.id) _this2.accessToken(response.data.access.id);
              q.resolve(response);
            }).catch(function (err) {
              q.reject(err);
            });
          } else {
            q.reject(false);
          }
          return q.promise;
        },
        kettles: {
          get: async function get() {
            var q = $q.defer();
            if (!_this2.accessToken()) {
              var auth = await _this2.streams().auth();
              if (!_this2.accessToken()) {
                q.reject('Sorry Bad Authentication');
                return q.promise;
              }
            }
            request.url += '/kettles';
            request.method = 'GET';
            request.headers['Content-Type'] = 'application/json';
            request.headers['Authorization'] = _this2.accessToken();
            $http(request).then(function (response) {
              q.resolve(response.data);
            }).catch(function (err) {
              q.reject(err);
            });
            return q.promise;
          },
          save: async function save(kettle) {
            var q = $q.defer();
            if (!_this2.accessToken()) {
              var auth = await _this2.streams().auth();
              if (!_this2.accessToken()) {
                q.reject('Sorry Bad Authentication');
                return q.promise;
              }
            }
            var updatedKettle = angular.copy(kettle);
            // remove not needed data
            delete updatedKettle.values;
            delete updatedKettle.message;
            delete updatedKettle.timers;
            delete updatedKettle.knob;
            updatedKettle.temp.adjust = settings.general.unit == 'F' && !!updatedKettle.temp.adjust ? $filter('round')(updatedKettle.temp.adjust * 0.555, 3) : updatedKettle.temp.adjust;
            request.url += '/kettles/arm';
            request.method = 'POST';
            request.data = {
              session: settings.streams.session,
              kettle: updatedKettle,
              notifications: settings.notifications
            };
            request.headers['Content-Type'] = 'application/json';
            request.headers['Authorization'] = _this2.accessToken();
            $http(request).then(function (response) {
              q.resolve(response.data);
            }).catch(function (err) {
              q.reject(err);
            });
            return q.promise;
          }
        },
        sessions: {
          get: async function get() {
            var q = $q.defer();
            if (!_this2.accessToken()) {
              var auth = await _this2.streams().auth();
              if (!_this2.accessToken()) {
                q.reject('Sorry Bad Authentication');
                return q.promise;
              }
            }
            request.url += '/sessions';
            request.method = 'GET';
            request.data = {
              sessionId: sessionId,
              kettle: kettle
            };
            request.headers['Content-Type'] = 'application/json';
            request.headers['Authorization'] = _this2.accessToken();
            $http(request).then(function (response) {
              q.resolve(response.data);
            }).catch(function (err) {
              q.reject(err);
            });
            return q.promise;
          },
          save: async function save(session) {
            var q = $q.defer();
            if (!_this2.accessToken()) {
              var auth = await _this2.streams().auth();
              if (!_this2.accessToken()) {
                q.reject('Sorry Bad Authentication');
                return q.promise;
              }
            }
            request.url += '/sessions/' + session.id;
            request.method = 'PATCH';
            request.data = {
              name: session.name,
              type: session.type
            };
            request.headers['Content-Type'] = 'application/json';
            request.headers['Authorization'] = _this2.accessToken();
            $http(request).then(function (response) {
              q.resolve(response.data);
            }).catch(function (err) {
              q.reject(err);
            });
            return q.promise;
          }
        }
      };
    },

    // do calcs that exist on the sketch
    bitcalc: function bitcalc(kettle) {
      var average = kettle.temp.raw;
      // https://www.arduino.cc/reference/en/language/functions/math/map/
      function fmap(x, in_min, in_max, out_min, out_max) {
        return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
      }
      if (kettle.temp.type == 'Thermistor') {
        var THERMISTORNOMINAL = 10000;
        // temp. for nominal resistance (almost always 25 C)
        var TEMPERATURENOMINAL = 25;
        // how many samples to take and average, more takes longer
        // but is more 'smooth'
        var NUMSAMPLES = 5;
        // The beta coefficient of the thermistor (usually 3000-4000)
        var BCOEFFICIENT = 3950;
        // the value of the 'other' resistor
        var SERIESRESISTOR = 10000;
        // convert the value to resistance
        // Are we using ADC?
        if (kettle.temp.pin.indexOf('C') === 0) {
          average = average * (5.0 / 65535) / 0.0001;
          var ln = Math.log(average / THERMISTORNOMINAL);
          var kelvin = 1 / (0.0033540170 + 0.00025617244 * ln + 0.0000021400943 * ln * ln + -0.000000072405219 * ln * ln * ln);
          // kelvin to celsius
          return kelvin - 273.15;
        } else {
          average = 1023 / average - 1;
          average = SERIESRESISTOR / average;

          var steinhart = average / THERMISTORNOMINAL; // (R/Ro)
          steinhart = Math.log(steinhart); // ln(R/Ro)
          steinhart /= BCOEFFICIENT; // 1/B * ln(R/Ro)
          steinhart += 1.0 / (TEMPERATURENOMINAL + 273.15); // + (1/To)
          steinhart = 1.0 / steinhart; // Invert
          steinhart -= 273.15;
          return steinhart;
        }
      } else if (kettle.temp.type == 'PT100') {
        if (kettle.temp.raw && kettle.temp.raw > 409) {
          return 150 * fmap(kettle.temp.raw, 410, 1023, 0, 614) / 614;
        }
      }
      return 'N/A';
    },

    influxdb: function influxdb() {
      var q = $q.defer();
      var settings = this.settings('settings');
      var influxConnection = '' + settings.influxdb.url;
      if (!!settings.influxdb.port && influxConnection.indexOf('streams.brewbench.co') === -1) influxConnection += ':' + settings.influxdb.port;

      return {
        ping: function ping(influxdb) {
          if (influxdb && influxdb.url) {
            influxConnection = '' + influxdb.url;
            if (!!influxdb.port && influxConnection.indexOf('streams.brewbench.co') === -1) influxConnection += ':' + influxdb.port;
          }
          var request = { url: '' + influxConnection, method: 'GET' };
          if (influxConnection.indexOf('streams.brewbench.co') !== -1) {
            request.url = influxConnection + '/ping';
            if (influxdb && influxdb.user && influxdb.pass) {
              request.headers = { 'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(influxdb.user.trim() + ':' + influxdb.pass.trim()) };
            } else {
              request.headers = { 'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(settings.influxdb.user.trim() + ':' + settings.influxdb.pass.trim()) };
            }
          }
          $http(request).then(function (response) {
            console.log(response);
            q.resolve(response);
          }).catch(function (err) {
            q.reject(err);
          });
          return q.promise;
        },
        dbs: function dbs() {
          if (influxConnection.indexOf('streams.brewbench.co') !== -1) {
            q.resolve([settings.influxdb.user]);
          } else {
            $http({ url: influxConnection + '/query?u=' + settings.influxdb.user.trim() + '&p=' + settings.influxdb.pass.trim() + '&q=' + encodeURIComponent('show databases'), method: 'GET' }).then(function (response) {
              if (response.data && response.data.results && response.data.results.length && response.data.results[0].series && response.data.results[0].series.length && response.data.results[0].series[0].values) {
                q.resolve(response.data.results[0].series[0].values);
              } else {
                q.resolve([]);
              }
            }).catch(function (err) {
              q.reject(err);
            });
          }
          return q.promise;
        },
        createDB: function createDB(name) {
          if (influxConnection.indexOf('streams.brewbench.co') !== -1) {
            q.reject('Database already exists');
          } else {
            $http({ url: influxConnection + '/query?u=' + settings.influxdb.user.trim() + '&p=' + settings.influxdb.pass.trim() + '&q=' + encodeURIComponent('CREATE DATABASE "' + name + '"'), method: 'POST' }).then(function (response) {
              q.resolve(response);
            }).catch(function (err) {
              q.reject(err);
            });
          }
          return q.promise;
        }
      };
    },

    pkg: function pkg() {
      var q = $q.defer();
      $http.get('/package.json').then(function (response) {
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    grains: function grains() {
      var q = $q.defer();
      $http.get('/assets/data/grains.json').then(function (response) {
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    hops: function hops() {
      var q = $q.defer();
      $http.get('/assets/data/hops.json').then(function (response) {
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    water: function water() {
      var q = $q.defer();
      $http.get('/assets/data/water.json').then(function (response) {
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    styles: function styles() {
      var q = $q.defer();
      $http.get('/assets/data/styleguide.json').then(function (response) {
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    lovibond: function lovibond() {
      var q = $q.defer();
      $http.get('/assets/data/lovibond.json').then(function (response) {
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    chartOptions: function chartOptions(options) {
      return {
        chart: {
          type: 'lineChart',
          title: {
            enable: !!options.session,
            text: !!options.session ? options.session : ''
          },
          noData: 'BrewBench Monitor',
          height: 350,
          margin: {
            top: 20,
            right: 20,
            bottom: 100,
            left: 65
          },
          x: function x(d) {
            return d && d.length ? d[0] : d;
          },
          y: function y(d) {
            return d && d.length ? d[1] : d;
          },
          // average: function(d) { return d.mean },

          color: d3.scale.category10().range(),
          duration: 300,
          useInteractiveGuideline: true,
          clipVoronoi: false,
          interpolate: 'basis',
          legend: {
            key: function key(d) {
              return d.name;
            }
          },
          isArea: function isArea(d) {
            return !!options.chart.area;
          },
          xAxis: {
            axisLabel: 'Time',
            tickFormat: function tickFormat(d) {
              if (!!options.chart.military) return d3.time.format('%H:%M:%S')(new Date(d)).toLowerCase();else return d3.time.format('%I:%M:%S%p')(new Date(d)).toLowerCase();
            },
            orient: 'bottom',
            tickPadding: 20,
            axisLabelDistance: 40,
            staggerLabels: true
          },
          forceY: !options.unit || options.unit == 'F' ? [0, 220] : [-17, 104],
          yAxis: {
            axisLabel: 'Temperature',
            tickFormat: function tickFormat(d) {
              return $filter('number')(d, 0) + '\xB0';
            },
            orient: 'left',
            showMaxMin: true,
            axisLabelDistance: 0
          }
        }
      };
    },
    // http://www.brewersfriend.com/2011/06/16/alcohol-by-volume-calculator-updated/
    // Papazian
    abv: function abv(og, fg) {
      return ((og - fg) * 131.25).toFixed(2);
    },
    // Daniels, used for high gravity beers
    abva: function abva(og, fg) {
      return (76.08 * (og - fg) / (1.775 - og) * (fg / 0.794)).toFixed(2);
    },
    // http://hbd.org/ensmingr/
    abw: function abw(abv, fg) {
      return (0.79 * abv / fg).toFixed(2);
    },
    re: function re(op, fp) {
      return 0.1808 * op + 0.8192 * fp;
    },
    attenuation: function attenuation(op, fp) {
      return ((1 - fp / op) * 100).toFixed(2);
    },
    calories: function calories(abw, re, fg) {
      return ((6.9 * abw + 4.0 * (re - 0.1)) * fg * 3.55).toFixed(1);
    },
    // http://www.brewersfriend.com/plato-to-sg-conversion-chart/
    sg: function sg(plato) {
      var sg = (1 + plato / (258.6 - plato / 258.2 * 227.1)).toFixed(3);
      return parseFloat(sg);
    },
    plato: function plato(sg) {
      var plato = (-1 * 616.868 + 1111.14 * sg - 630.272 * Math.pow(sg, 2) + 135.997 * Math.pow(sg, 3)).toString();
      if (plato.substring(plato.indexOf('.') + 1, plato.indexOf('.') + 2) == 5) plato = plato.substring(0, plato.indexOf('.') + 2);else if (plato.substring(plato.indexOf('.') + 1, plato.indexOf('.') + 2) < 5) plato = plato.substring(0, plato.indexOf('.'));else if (plato.substring(plato.indexOf('.') + 1, plato.indexOf('.') + 2) > 5) {
        plato = plato.substring(0, plato.indexOf('.'));
        plato = parseFloat(plato) + 1;
      }
      return parseFloat(plato);
    },
    recipeBeerSmith: function recipeBeerSmith(recipe) {
      var response = { name: '', date: '', brewer: { name: '' }, category: '', abv: '', og: 0.000, fg: 0.000, ibu: 0, hops: [], grains: [], yeast: [], misc: [] };
      if (!!recipe.F_R_NAME) response.name = recipe.F_R_NAME;
      if (!!recipe.F_R_STYLE.F_S_CATEGORY) response.category = recipe.F_R_STYLE.F_S_CATEGORY;
      if (!!recipe.F_R_DATE) response.date = recipe.F_R_DATE;
      if (!!recipe.F_R_BREWER) response.brewer.name = recipe.F_R_BREWER;

      if (!!recipe.F_R_STYLE.F_S_MAX_OG) response.og = parseFloat(recipe.F_R_STYLE.F_S_MAX_OG).toFixed(3);else if (!!recipe.F_R_STYLE.F_S_MIN_OG) response.og = parseFloat(recipe.F_R_STYLE.F_S_MIN_OG).toFixed(3);
      if (!!recipe.F_R_STYLE.F_S_MAX_FG) response.fg = parseFloat(recipe.F_R_STYLE.F_S_MAX_FG).toFixed(3);else if (!!recipe.F_R_STYLE.F_S_MIN_FG) response.fg = parseFloat(recipe.F_R_STYLE.F_S_MIN_FG).toFixed(3);

      if (!!recipe.F_R_STYLE.F_S_MAX_ABV) response.abv = $filter('number')(recipe.F_R_STYLE.F_S_MAX_ABV, 2);else if (!!recipe.F_R_STYLE.F_S_MIN_ABV) response.abv = $filter('number')(recipe.F_R_STYLE.F_S_MIN_ABV, 2);

      if (!!recipe.F_R_STYLE.F_S_MAX_IBU) response.ibu = parseInt(recipe.F_R_STYLE.F_S_MAX_IBU, 10);else if (!!recipe.F_R_STYLE.F_S_MIN_IBU) response.ibu = parseInt(recipe.F_R_STYLE.F_S_MIN_IBU, 10);

      if (!!recipe.Ingredients.Data.Grain) {
        _.each(recipe.Ingredients.Data.Grain, function (grain) {
          response.grains.push({
            label: grain.F_G_NAME,
            min: parseInt(grain.F_G_BOIL_TIME, 10),
            notes: $filter('number')(grain.F_G_AMOUNT / 16, 2) + ' lbs.',
            amount: $filter('number')(grain.F_G_AMOUNT / 16, 2)
          });
        });
      }

      if (!!recipe.Ingredients.Data.Hops) {
        _.each(recipe.Ingredients.Data.Hops, function (hop) {
          response.hops.push({
            label: hop.F_H_NAME,
            min: parseInt(hop.F_H_DRY_HOP_TIME, 10) > 0 ? null : parseInt(hop.F_H_BOIL_TIME, 10),
            notes: parseInt(hop.F_H_DRY_HOP_TIME, 10) > 0 ? 'Dry Hop ' + $filter('number')(hop.F_H_AMOUNT, 2) + ' oz.' + ' for ' + parseInt(hop.F_H_DRY_HOP_TIME, 10) + ' Days' : $filter('number')(hop.F_H_AMOUNT, 2) + ' oz.',
            amount: $filter('number')(hop.F_H_AMOUNT, 2)
          });
          // hop.F_H_ALPHA
          // hop.F_H_DRY_HOP_TIME
          // hop.F_H_ORIGIN
        });
      }

      if (!!recipe.Ingredients.Data.Misc) {
        if (recipe.Ingredients.Data.Misc.length) {
          _.each(recipe.Ingredients.Data.Misc, function (misc) {
            response.misc.push({
              label: misc.F_M_NAME,
              min: parseInt(misc.F_M_TIME, 10),
              notes: $filter('number')(misc.F_M_AMOUNT, 2) + ' g.',
              amount: $filter('number')(misc.F_M_AMOUNT, 2)
            });
          });
        } else {
          response.misc.push({
            label: recipe.Ingredients.Data.Misc.F_M_NAME,
            min: parseInt(recipe.Ingredients.Data.Misc.F_M_TIME, 10),
            notes: $filter('number')(recipe.Ingredients.Data.Misc.F_M_AMOUNT, 2) + ' g.',
            amount: $filter('number')(recipe.Ingredients.Data.Misc.F_M_AMOUNT, 2)
          });
        }
      }

      if (!!recipe.Ingredients.Data.Yeast) {
        if (recipe.Ingredients.Data.Yeast.length) {
          _.each(recipe.Ingredients.Data.Yeast, function (yeast) {
            response.yeast.push({
              name: yeast.F_Y_LAB + ' ' + (yeast.F_Y_PRODUCT_ID ? yeast.F_Y_PRODUCT_ID : yeast.F_Y_NAME)
            });
          });
        } else {
          response.yeast.push({
            name: recipe.Ingredients.Data.Yeast.F_Y_LAB + ' ' + (recipe.Ingredients.Data.Yeast.F_Y_PRODUCT_ID ? recipe.Ingredients.Data.Yeast.F_Y_PRODUCT_ID : recipe.Ingredients.Data.Yeast.F_Y_NAME)
          });
        }
      }
      return response;
    },
    recipeBeerXML: function recipeBeerXML(recipe) {
      var response = { name: '', date: '', brewer: { name: '' }, category: '', abv: '', og: 0.000, fg: 0.000, ibu: 0, hops: [], grains: [], yeast: [], misc: [] };
      var mash_time = 60;

      if (!!recipe.NAME) response.name = recipe.NAME;
      if (!!recipe.STYLE.CATEGORY) response.category = recipe.STYLE.CATEGORY;

      // if(!!recipe.F_R_DATE)
      //   response.date = recipe.F_R_DATE;
      if (!!recipe.BREWER) response.brewer.name = recipe.BREWER;

      if (!!recipe.OG) response.og = parseFloat(recipe.OG).toFixed(3);
      if (!!recipe.FG) response.fg = parseFloat(recipe.FG).toFixed(3);

      if (!!recipe.IBU) response.ibu = parseInt(recipe.IBU, 10);

      if (!!recipe.STYLE.ABV_MAX) response.abv = $filter('number')(recipe.STYLE.ABV_MAX, 2);else if (!!recipe.STYLE.ABV_MIN) response.abv = $filter('number')(recipe.STYLE.ABV_MIN, 2);

      if (!!recipe.MASH.MASH_STEPS.MASH_STEP && recipe.MASH.MASH_STEPS.MASH_STEP.length && recipe.MASH.MASH_STEPS.MASH_STEP[0].STEP_TIME) {
        mash_time = recipe.MASH.MASH_STEPS.MASH_STEP[0].STEP_TIME;
      }

      if (!!recipe.FERMENTABLES) {
        var grains = recipe.FERMENTABLES.FERMENTABLE && recipe.FERMENTABLES.FERMENTABLE.length ? recipe.FERMENTABLES.FERMENTABLE : recipe.FERMENTABLES;
        _.each(grains, function (grain) {
          response.grains.push({
            label: grain.NAME,
            min: parseInt(mash_time, 10),
            notes: $filter('number')(grain.AMOUNT, 2) + ' lbs.',
            amount: $filter('number')(grain.AMOUNT, 2)
          });
        });
      }

      if (!!recipe.HOPS) {
        var hops = recipe.HOPS.HOP && recipe.HOPS.HOP.length ? recipe.HOPS.HOP : recipe.HOPS;
        _.each(hops, function (hop) {
          response.hops.push({
            label: hop.NAME + ' (' + hop.FORM + ')',
            min: hop.USE == 'Dry Hop' ? 0 : parseInt(hop.TIME, 10),
            notes: hop.USE == 'Dry Hop' ? hop.USE + ' ' + $filter('number')(hop.AMOUNT * 1000 / 28.3495, 2) + ' oz.' + ' for ' + parseInt(hop.TIME / 60 / 24, 10) + ' Days' : hop.USE + ' ' + $filter('number')(hop.AMOUNT * 1000 / 28.3495, 2) + ' oz.',
            amount: $filter('number')(hop.AMOUNT * 1000 / 28.3495, 2)
          });
        });
      }

      if (!!recipe.MISCS) {
        var misc = recipe.MISCS.MISC && recipe.MISCS.MISC.length ? recipe.MISCS.MISC : recipe.MISCS;
        _.each(misc, function (misc) {
          response.misc.push({
            label: misc.NAME,
            min: parseInt(misc.TIME, 10),
            notes: 'Add ' + misc.AMOUNT + ' to ' + misc.USE,
            amount: misc.AMOUNT
          });
        });
      }

      if (!!recipe.YEASTS) {
        var yeast = recipe.YEASTS.YEAST && recipe.YEASTS.YEAST.length ? recipe.YEASTS.YEAST : recipe.YEASTS;
        _.each(yeast, function (yeast) {
          response.yeast.push({
            name: yeast.NAME
          });
        });
      }
      return response;
    },
    formatXML: function formatXML(content) {
      var htmlchars = [{ f: '&Ccedil;', r: 'Ç' }, { f: '&ccedil;', r: 'ç' }, { f: '&Euml;', r: 'Ë' }, { f: '&euml;', r: 'ë' }, { f: '&#262;', r: 'Ć' }, { f: '&#263;', r: 'ć' }, { f: '&#268;', r: 'Č' }, { f: '&#269;', r: 'č' }, { f: '&#272;', r: 'Đ' }, { f: '&#273;', r: 'đ' }, { f: '&#352;', r: 'Š' }, { f: '&#353;', r: 'š' }, { f: '&#381;', r: 'Ž' }, { f: '&#382;', r: 'ž' }, { f: '&Agrave;', r: 'À' }, { f: '&agrave;', r: 'à' }, { f: '&Ccedil;', r: 'Ç' }, { f: '&ccedil;', r: 'ç' }, { f: '&Egrave;', r: 'È' }, { f: '&egrave;', r: 'è' }, { f: '&Eacute;', r: 'É' }, { f: '&eacute;', r: 'é' }, { f: '&Iacute;', r: 'Í' }, { f: '&iacute;', r: 'í' }, { f: '&Iuml;', r: 'Ï' }, { f: '&iuml;', r: 'ï' }, { f: '&Ograve;', r: 'Ò' }, { f: '&ograve;', r: 'ò' }, { f: '&Oacute;', r: 'Ó' }, { f: '&oacute;', r: 'ó' }, { f: '&Uacute;', r: 'Ú' }, { f: '&uacute;', r: 'ú' }, { f: '&Uuml;', r: 'Ü' }, { f: '&uuml;', r: 'ü' }, { f: '&middot;', r: '·' }, { f: '&#262;', r: 'Ć' }, { f: '&#263;', r: 'ć' }, { f: '&#268;', r: 'Č' }, { f: '&#269;', r: 'č' }, { f: '&#272;', r: 'Đ' }, { f: '&#273;', r: 'đ' }, { f: '&#352;', r: 'Š' }, { f: '&#353;', r: 'š' }, { f: '&#381;', r: 'Ž' }, { f: '&#382;', r: 'ž' }, { f: '&Aacute;', r: 'Á' }, { f: '&aacute;', r: 'á' }, { f: '&#268;', r: 'Č' }, { f: '&#269;', r: 'č' }, { f: '&#270;', r: 'Ď' }, { f: '&#271;', r: 'ď' }, { f: '&Eacute;', r: 'É' }, { f: '&eacute;', r: 'é' }, { f: '&#282;', r: 'Ě' }, { f: '&#283;', r: 'ě' }, { f: '&Iacute;', r: 'Í' }, { f: '&iacute;', r: 'í' }, { f: '&#327;', r: 'Ň' }, { f: '&#328;', r: 'ň' }, { f: '&Oacute;', r: 'Ó' }, { f: '&oacute;', r: 'ó' }, { f: '&#344;', r: 'Ř' }, { f: '&#345;', r: 'ř' }, { f: '&#352;', r: 'Š' }, { f: '&#353;', r: 'š' }, { f: '&#356;', r: 'Ť' }, { f: '&#357;', r: 'ť' }, { f: '&Uacute;', r: 'Ú' }, { f: '&uacute;', r: 'ú' }, { f: '&#366;', r: 'Ů' }, { f: '&#367;', r: 'ů' }, { f: '&Yacute;', r: 'Ý' }, { f: '&yacute;', r: 'ý' }, { f: '&#381;', r: 'Ž' }, { f: '&#382;', r: 'ž' }, { f: '&AElig;', r: 'Æ' }, { f: '&aelig;', r: 'æ' }, { f: '&Oslash;', r: 'Ø' }, { f: '&oslash;', r: 'ø' }, { f: '&Aring;', r: 'Å' }, { f: '&aring;', r: 'å' }, { f: '&Eacute;', r: 'É' }, { f: '&eacute;', r: 'é' }, { f: '&Euml;', r: 'Ë' }, { f: '&euml;', r: 'ë' }, { f: '&Iuml;', r: 'Ï' }, { f: '&iuml;', r: 'ï' }, { f: '&Oacute;', r: 'Ó' }, { f: '&oacute;', r: 'ó' }, { f: '&#264;', r: 'Ĉ' }, { f: '&#265;', r: 'ĉ' }, { f: '&#284;', r: 'Ĝ' }, { f: '&#285;', r: 'ĝ' }, { f: '&#292;', r: 'Ĥ' }, { f: '&#293;', r: 'ĥ' }, { f: '&#308;', r: 'Ĵ' }, { f: '&#309;', r: 'ĵ' }, { f: '&#348;', r: 'Ŝ' }, { f: '&#349;', r: 'ŝ' }, { f: '&#364;', r: 'Ŭ' }, { f: '&#365;', r: 'ŭ' }, { f: '&Auml;', r: 'Ä' }, { f: '&auml;', r: 'ä' }, { f: '&Ouml;', r: 'Ö' }, { f: '&ouml;', r: 'ö' }, { f: '&Otilde;', r: 'Õ' }, { f: '&otilde;', r: 'õ' }, { f: '&Uuml;', r: 'Ü' }, { f: '&uuml;', r: 'ü' }, { f: '&Aacute;', r: 'Á' }, { f: '&aacute;', r: 'á' }, { f: '&ETH;', r: 'Ð' }, { f: '&eth;', r: 'ð' }, { f: '&Iacute;', r: 'Í' }, { f: '&iacute;', r: 'í' }, { f: '&Oacute;', r: 'Ó' }, { f: '&oacute;', r: 'ó' }, { f: '&Uacute;', r: 'Ú' }, { f: '&uacute;', r: 'ú' }, { f: '&Yacute;', r: 'Ý' }, { f: '&yacute;', r: 'ý' }, { f: '&AElig;', r: 'Æ' }, { f: '&aelig;', r: 'æ' }, { f: '&Oslash;', r: 'Ø' }, { f: '&oslash;', r: 'ø' }, { f: '&Auml;', r: 'Ä' }, { f: '&auml;', r: 'ä' }, { f: '&Ouml;', r: 'Ö' }, { f: '&ouml;', r: 'ö' }, { f: '&Agrave;', r: 'À' }, { f: '&agrave;', r: 'à' }, { f: '&Acirc;', r: 'Â' }, { f: '&acirc;', r: 'â' }, { f: '&Ccedil;', r: 'Ç' }, { f: '&ccedil;', r: 'ç' }, { f: '&Egrave;', r: 'È' }, { f: '&egrave;', r: 'è' }, { f: '&Eacute;', r: 'É' }, { f: '&eacute;', r: 'é' }, { f: '&Ecirc;', r: 'Ê' }, { f: '&ecirc;', r: 'ê' }, { f: '&Euml;', r: 'Ë' }, { f: '&euml;', r: 'ë' }, { f: '&Icirc;', r: 'Î' }, { f: '&icirc;', r: 'î' }, { f: '&Iuml;', r: 'Ï' }, { f: '&iuml;', r: 'ï' }, { f: '&Ocirc;', r: 'Ô' }, { f: '&ocirc;', r: 'ô' }, { f: '&OElig;', r: 'Œ' }, { f: '&oelig;', r: 'œ' }, { f: '&Ugrave;', r: 'Ù' }, { f: '&ugrave;', r: 'ù' }, { f: '&Ucirc;', r: 'Û' }, { f: '&ucirc;', r: 'û' }, { f: '&Uuml;', r: 'Ü' }, { f: '&uuml;', r: 'ü' }, { f: '&#376;', r: 'Ÿ' }, { f: '&yuml;', r: 'ÿ' }, { f: '&Auml;', r: 'Ä' }, { f: '&auml;', r: 'ä' }, { f: '&Ouml;', r: 'Ö' }, { f: '&ouml;', r: 'ö' }, { f: '&Uuml;', r: 'Ü' }, { f: '&uuml;', r: 'ü' }, { f: '&szlig;', r: 'ß' }, { f: '&Aacute;', r: 'Á' }, { f: '&aacute;', r: 'á' }, { f: '&Acirc;', r: 'Â' }, { f: '&acirc;', r: 'â' }, { f: '&Atilde;', r: 'Ã' }, { f: '&atilde;', r: 'ã' }, { f: '&Iacute;', r: 'Í' }, { f: '&iacute;', r: 'í' }, { f: '&Icirc;', r: 'Î' }, { f: '&icirc;', r: 'î' }, { f: '&#296;', r: 'Ĩ' }, { f: '&#297;', r: 'ĩ' }, { f: '&Uacute;', r: 'Ú' }, { f: '&ugrave;', r: 'ù' }, { f: '&Ucirc;', r: 'Û' }, { f: '&ucirc;', r: 'û' }, { f: '&#360;', r: 'Ũ' }, { f: '&#361;', r: 'ũ' }, { f: '&#312;', r: 'ĸ' }, { f: '&Aacute;', r: 'Á' }, { f: '&aacute;', r: 'á' }, { f: '&Eacute;', r: 'É' }, { f: '&eacute;', r: 'é' }, { f: '&Iacute;', r: 'Í' }, { f: '&iacute;', r: 'í' }, { f: '&Oacute;', r: 'Ó' }, { f: '&oacute;', r: 'ó' }, { f: '&Ouml;', r: 'Ö' }, { f: '&ouml;', r: 'ö' }, { f: '&#336;', r: 'Ő' }, { f: '&#337;', r: 'ő' }, { f: '&Uacute;', r: 'Ú' }, { f: '&uacute;', r: 'ú' }, { f: '&Uuml;', r: 'Ü' }, { f: '&uuml;', r: 'ü' }, { f: '&#368;', r: 'Ű' }, { f: '&#369;', r: 'ű' }, { f: '&Aacute;', r: 'Á' }, { f: '&aacute;', r: 'á' }, { f: '&ETH;', r: 'Ð' }, { f: '&eth;', r: 'ð' }, { f: '&Eacute;', r: 'É' }, { f: '&eacute;', r: 'é' }, { f: '&Iacute;', r: 'Í' }, { f: '&iacute;', r: 'í' }, { f: '&Oacute;', r: 'Ó' }, { f: '&oacute;', r: 'ó' }, { f: '&Uacute;', r: 'Ú' }, { f: '&uacute;', r: 'ú' }, { f: '&Yacute;', r: 'Ý' }, { f: '&yacute;', r: 'ý' }, { f: '&THORN;', r: 'Þ' }, { f: '&thorn;', r: 'þ' }, { f: '&AElig;', r: 'Æ' }, { f: '&aelig;', r: 'æ' }, { f: '&Ouml;', r: 'Ö' }, { f: '&uml;', r: 'ö' }, { f: '&Aacute;', r: 'Á' }, { f: '&aacute;', r: 'á' }, { f: '&Eacute;', r: 'É' }, { f: '&eacute;', r: 'é' }, { f: '&Iacute;', r: 'Í' }, { f: '&iacute;', r: 'í' }, { f: '&Oacute;', r: 'Ó' }, { f: '&oacute;', r: 'ó' }, { f: '&Uacute;', r: 'Ú' }, { f: '&uacute;', r: 'ú' }, { f: '&Agrave;', r: 'À' }, { f: '&agrave;', r: 'à' }, { f: '&Acirc;', r: 'Â' }, { f: '&acirc;', r: 'â' }, { f: '&Egrave;', r: 'È' }, { f: '&egrave;', r: 'è' }, { f: '&Eacute;', r: 'É' }, { f: '&eacute;', r: 'é' }, { f: '&Ecirc;', r: 'Ê' }, { f: '&ecirc;', r: 'ê' }, { f: '&Igrave;', r: 'Ì' }, { f: '&igrave;', r: 'ì' }, { f: '&Iacute;', r: 'Í' }, { f: '&iacute;', r: 'í' }, { f: '&Icirc;', r: 'Î' }, { f: '&icirc;', r: 'î' }, { f: '&Iuml;', r: 'Ï' }, { f: '&iuml;', r: 'ï' }, { f: '&Ograve;', r: 'Ò' }, { f: '&ograve;', r: 'ò' }, { f: '&Ocirc;', r: 'Ô' }, { f: '&ocirc;', r: 'ô' }, { f: '&Ugrave;', r: 'Ù' }, { f: '&ugrave;', r: 'ù' }, { f: '&Ucirc;', r: 'Û' }, { f: '&ucirc;', r: 'û' }, { f: '&#256;', r: 'Ā' }, { f: '&#257;', r: 'ā' }, { f: '&#268;', r: 'Č' }, { f: '&#269;', r: 'č' }, { f: '&#274;', r: 'Ē' }, { f: '&#275;', r: 'ē' }, { f: '&#290;', r: 'Ģ' }, { f: '&#291;', r: 'ģ' }, { f: '&#298;', r: 'Ī' }, { f: '&#299;', r: 'ī' }, { f: '&#310;', r: 'Ķ' }, { f: '&#311;', r: 'ķ' }, { f: '&#315;', r: 'Ļ' }, { f: '&#316;', r: 'ļ' }, { f: '&#325;', r: 'Ņ' }, { f: '&#326;', r: 'ņ' }, { f: '&#342;', r: 'Ŗ' }, { f: '&#343;', r: 'ŗ' }, { f: '&#352;', r: 'Š' }, { f: '&#353;', r: 'š' }, { f: '&#362;', r: 'Ū' }, { f: '&#363;', r: 'ū' }, { f: '&#381;', r: 'Ž' }, { f: '&#382;', r: 'ž' }, { f: '&AElig;', r: 'Æ' }, { f: '&aelig;', r: 'æ' }, { f: '&Oslash;', r: 'Ø' }, { f: '&oslash;', r: 'ø' }, { f: '&Aring;', r: 'Å' }, { f: '&aring;', r: 'å' }, { f: '&#260;', r: 'Ą' }, { f: '&#261;', r: 'ą' }, { f: '&#262;', r: 'Ć' }, { f: '&#263;', r: 'ć' }, { f: '&#280;', r: 'Ę' }, { f: '&#281;', r: 'ę' }, { f: '&#321;', r: 'Ł' }, { f: '&#322;', r: 'ł' }, { f: '&#323;', r: 'Ń' }, { f: '&#324;', r: 'ń' }, { f: '&Oacute;', r: 'Ó' }, { f: '&oacute;', r: 'ó' }, { f: '&#346;', r: 'Ś' }, { f: '&#347;', r: 'ś' }, { f: '&#377;', r: 'Ź' }, { f: '&#378;', r: 'ź' }, { f: '&#379;', r: 'Ż' }, { f: '&#380;', r: 'ż' }, { f: '&Agrave;', r: 'À' }, { f: '&agrave;', r: 'à' }, { f: '&Aacute;', r: 'Á' }, { f: '&aacute;', r: 'á' }, { f: '&Acirc;', r: 'Â' }, { f: '&acirc;', r: 'â' }, { f: '&Atilde;', r: 'Ã' }, { f: '&atilde;', r: 'ã' }, { f: '&Ccedil;', r: 'Ç' }, { f: '&ccedil;', r: 'ç' }, { f: '&Egrave;', r: 'È' }, { f: '&egrave;', r: 'è' }, { f: '&Eacute;', r: 'É' }, { f: '&eacute;', r: 'é' }, { f: '&Ecirc;', r: 'Ê' }, { f: '&ecirc;', r: 'ê' }, { f: '&Igrave;', r: 'Ì' }, { f: '&igrave;', r: 'ì' }, { f: '&Iacute;', r: 'Í' }, { f: '&iacute;', r: 'í' }, { f: '&Iuml;', r: 'Ï' }, { f: '&iuml;', r: 'ï' }, { f: '&Ograve;', r: 'Ò' }, { f: '&ograve;', r: 'ò' }, { f: '&Oacute;', r: 'Ó' }, { f: '&oacute;', r: 'ó' }, { f: '&Otilde;', r: 'Õ' }, { f: '&otilde;', r: 'õ' }, { f: '&Ugrave;', r: 'Ù' }, { f: '&ugrave;', r: 'ù' }, { f: '&Uacute;', r: 'Ú' }, { f: '&uacute;', r: 'ú' }, { f: '&Uuml;', r: 'Ü' }, { f: '&uuml;', r: 'ü' }, { f: '&ordf;', r: 'ª' }, { f: '&ordm;', r: 'º' }, { f: '&#258;', r: 'Ă' }, { f: '&#259;', r: 'ă' }, { f: '&Acirc;', r: 'Â' }, { f: '&acirc;', r: 'â' }, { f: '&Icirc;', r: 'Î' }, { f: '&icirc;', r: 'î' }, { f: '&#350;', r: 'Ş' }, { f: '&#351;', r: 'ş' }, { f: '&#354;', r: 'Ţ' }, { f: '&#355;', r: 'ţ' }, { f: '&Aacute;', r: 'Á' }, { f: '&aacute;', r: 'á' }, { f: '&#268;', r: 'Č' }, { f: '&#269;', r: 'č' }, { f: '&#272;', r: 'Đ' }, { f: '&#273;', r: 'đ' }, { f: '&#330;', r: 'Ŋ' }, { f: '&#331;', r: 'ŋ' }, { f: '&#352;', r: 'Š' }, { f: '&#353;', r: 'š' }, { f: '&#358;', r: 'Ŧ' }, { f: '&#359;', r: 'ŧ' }, { f: '&#381;', r: 'Ž' }, { f: '&#382;', r: 'ž' }, { f: '&Agrave;', r: 'À' }, { f: '&agrave;', r: 'à' }, { f: '&Egrave;', r: 'È' }, { f: '&egrave;', r: 'è' }, { f: '&Eacute;', r: 'É' }, { f: '&eacute;', r: 'é' }, { f: '&Igrave;', r: 'Ì' }, { f: '&igrave;', r: 'ì' }, { f: '&Ograve;', r: 'Ò' }, { f: '&ograve;', r: 'ò' }, { f: '&Oacute;', r: 'Ó' }, { f: '&oacute;', r: 'ó' }, { f: '&Ugrave;', r: 'Ù' }, { f: '&ugrave;', r: 'ù' }, { f: '&Aacute;', r: 'Á' }, { f: '&aacute;', r: 'á' }, { f: '&Auml;', r: 'Ä' }, { f: '&auml;', r: 'ä' }, { f: '&#268;', r: 'Č' }, { f: '&#269;', r: 'č' }, { f: '&#270;', r: 'Ď' }, { f: '&#271;', r: 'ď' }, { f: '&Eacute;', r: 'É' }, { f: '&eacute;', r: 'é' }, { f: '&#313;', r: 'Ĺ' }, { f: '&#314;', r: 'ĺ' }, { f: '&#317;', r: 'Ľ' }, { f: '&#318;', r: 'ľ' }, { f: '&#327;', r: 'Ň' }, { f: '&#328;', r: 'ň' }, { f: '&Oacute;', r: 'Ó' }, { f: '&oacute;', r: 'ó' }, { f: '&Ocirc;', r: 'Ô' }, { f: '&ocirc;', r: 'ô' }, { f: '&#340;', r: 'Ŕ' }, { f: '&#341;', r: 'ŕ' }, { f: '&#352;', r: 'Š' }, { f: '&#353;', r: 'š' }, { f: '&#356;', r: 'Ť' }, { f: '&#357;', r: 'ť' }, { f: '&Uacute;', r: 'Ú' }, { f: '&uacute;', r: 'ú' }, { f: '&Yacute;', r: 'Ý' }, { f: '&yacute;', r: 'ý' }, { f: '&#381;', r: 'Ž' }, { f: '&#382;', r: 'ž' }, { f: '&#268;', r: 'Č' }, { f: '&#269;', r: 'č' }, { f: '&#352;', r: 'Š' }, { f: '&#353;', r: 'š' }, { f: '&#381;', r: 'Ž' }, { f: '&#382;', r: 'ž' }, { f: '&Aacute;', r: 'Á' }, { f: '&aacute;', r: 'á' }, { f: '&Eacute;', r: 'É' }, { f: '&eacute;', r: 'é' }, { f: '&Iacute;', r: 'Í' }, { f: '&iacute;', r: 'í' }, { f: '&Oacute;', r: 'Ó' }, { f: '&oacute;', r: 'ó' }, { f: '&Ntilde;', r: 'Ñ' }, { f: '&ntilde;', r: 'ñ' }, { f: '&Uacute;', r: 'Ú' }, { f: '&uacute;', r: 'ú' }, { f: '&Uuml;', r: 'Ü' }, { f: '&uuml;', r: 'ü' }, { f: '&iexcl;', r: '¡' }, { f: '&ordf;', r: 'ª' }, { f: '&iquest;', r: '¿' }, { f: '&ordm;', r: 'º' }, { f: '&Aring;', r: 'Å' }, { f: '&aring;', r: 'å' }, { f: '&Auml;', r: 'Ä' }, { f: '&auml;', r: 'ä' }, { f: '&Ouml;', r: 'Ö' }, { f: '&ouml;', r: 'ö' }, { f: '&Ccedil;', r: 'Ç' }, { f: '&ccedil;', r: 'ç' }, { f: '&#286;', r: 'Ğ' }, { f: '&#287;', r: 'ğ' }, { f: '&#304;', r: 'İ' }, { f: '&#305;', r: 'ı' }, { f: '&Ouml;', r: 'Ö' }, { f: '&ouml;', r: 'ö' }, { f: '&#350;', r: 'Ş' }, { f: '&#351;', r: 'ş' }, { f: '&Uuml;', r: 'Ü' }, { f: '&uuml;', r: 'ü' }, { f: '&euro;', r: '€' }, { f: '&pound;', r: '£' }, { f: '&laquo;', r: '«' }, { f: '&raquo;', r: '»' }, { f: '&bull;', r: '•' }, { f: '&dagger;', r: '†' }, { f: '&copy;', r: '©' }, { f: '&reg;', r: '®' }, { f: '&trade;', r: '™' }, { f: '&deg;', r: '°' }, { f: '&permil;', r: '‰' }, { f: '&micro;', r: 'µ' }, { f: '&middot;', r: '·' }, { f: '&ndash;', r: '–' }, { f: '&mdash;', r: '—' }, { f: '&#8470;', r: '№' }, { f: '&reg;', r: '®' }, { f: '&para;', r: '¶' }, { f: '&plusmn;', r: '±' }, { f: '&middot;', r: '·' }, { f: 'less-t', r: '<' }, { f: 'greater-t', r: '>' }, { f: '&not;', r: '¬' }, { f: '&curren;', r: '¤' }, { f: '&brvbar;', r: '¦' }, { f: '&deg;', r: '°' }, { f: '&acute;', r: '´' }, { f: '&uml;', r: '¨' }, { f: '&macr;', r: '¯' }, { f: '&cedil;', r: '¸' }, { f: '&laquo;', r: '«' }, { f: '&raquo;', r: '»' }, { f: '&sup1;', r: '¹' }, { f: '&sup2;', r: '²' }, { f: '&sup3;', r: '³' }, { f: '&ordf;', r: 'ª' }, { f: '&ordm;', r: 'º' }, { f: '&iexcl;', r: '¡' }, { f: '&iquest;', r: '¿' }, { f: '&micro;', r: 'µ' }, { f: 'hy;	', r: '&' }, { f: '&ETH;', r: 'Ð' }, { f: '&eth;', r: 'ð' }, { f: '&Ntilde;', r: 'Ñ' }, { f: '&ntilde;', r: 'ñ' }, { f: '&Oslash;', r: 'Ø' }, { f: '&oslash;', r: 'ø' }, { f: '&szlig;', r: 'ß' }, { f: '&amp;', r: 'and' }, { f: '&ldquo;', r: '"' }, { f: '&rdquo;', r: '"' }, { f: '&rsquo;', r: "'" }];

      _.each(htmlchars, function (char) {
        if (content.indexOf(char.f) !== -1) {
          content = content.replace(RegExp(char.f, 'g'), char.r);
        }
      });
      return content;
    }
  };
});
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(63)))

/***/ })

},[318]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCIkY29tcGlsZVByb3ZpZGVyIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwiaGVhZGVycyIsImNvbW1vbiIsImhhc2hQcmVmaXgiLCJhSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiYW5ndWxhciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0Iiwic2l0ZSIsImh0dHBzIiwiZG9jdW1lbnQiLCJwcm90b2NvbCIsImh0dHBzX3VybCIsImhvc3QiLCJlc3AiLCJ0eXBlIiwic3NpZCIsInNzaWRfcGFzcyIsImhvc3RuYW1lIiwiYXV0b2Nvbm5lY3QiLCJob3BzIiwiZ3JhaW5zIiwid2F0ZXIiLCJsb3ZpYm9uZCIsInBrZyIsImtldHRsZVR5cGVzIiwic2hvd1NldHRpbmdzIiwiZXJyb3IiLCJtZXNzYWdlIiwic2xpZGVyIiwibWluIiwib3B0aW9ucyIsImZsb29yIiwiY2VpbCIsInN0ZXAiLCJ0cmFuc2xhdGUiLCJ2YWx1ZSIsIm9uRW5kIiwia2V0dGxlSWQiLCJtb2RlbFZhbHVlIiwiaGlnaFZhbHVlIiwicG9pbnRlclR5cGUiLCJrZXR0bGUiLCJzcGxpdCIsImsiLCJrZXR0bGVzIiwiaGVhdGVyIiwiY29vbGVyIiwicHVtcCIsImFjdGl2ZSIsInB3bSIsInJ1bm5pbmciLCJ0b2dnbGVSZWxheSIsImdldEtldHRsZVNsaWRlck9wdGlvbnMiLCJpbmRleCIsIk9iamVjdCIsImFzc2lnbiIsImlkIiwiZ2V0TG92aWJvbmRDb2xvciIsInJhbmdlIiwicmVwbGFjZSIsImluZGV4T2YiLCJyQXJyIiwicGFyc2VGbG9hdCIsImwiLCJfIiwiZmlsdGVyIiwiaXRlbSIsInNybSIsImhleCIsImxlbmd0aCIsInNldHRpbmdzIiwicmVzZXQiLCJnZW5lcmFsIiwiY2hhcnRPcHRpb25zIiwidW5pdCIsImNoYXJ0Iiwic2Vzc2lvbiIsInN0cmVhbXMiLCJkZWZhdWx0S2V0dGxlcyIsInNoYXJlIiwicGFyYW1zIiwiZmlsZSIsInBhc3N3b3JkIiwibmVlZFBhc3N3b3JkIiwiYWNjZXNzIiwiZGVsZXRlQWZ0ZXIiLCJzdW1WYWx1ZXMiLCJvYmoiLCJzdW1CeSIsInVwZGF0ZUFCViIsInJlY2lwZSIsInNjYWxlIiwibWV0aG9kIiwiYWJ2Iiwib2ciLCJmZyIsImFidmEiLCJhYnciLCJhdHRlbnVhdGlvbiIsInBsYXRvIiwiY2Fsb3JpZXMiLCJyZSIsInNnIiwiY2hhbmdlTWV0aG9kIiwiY2hhbmdlU2NhbGUiLCJnZXRTdGF0dXNDbGFzcyIsInN0YXR1cyIsImVuZHNXaXRoIiwiZ2V0UG9ydFJhbmdlIiwibnVtYmVyIiwiQXJyYXkiLCJmaWxsIiwibWFwIiwiaWR4IiwiYXJkdWlub3MiLCJhZGQiLCJub3ciLCJEYXRlIiwicHVzaCIsImJ0b2EiLCJib2FyZCIsImFuYWxvZyIsImRpZ2l0YWwiLCJhZGMiLCJzZWN1cmUiLCJ2ZXJzaW9uIiwiZHQiLCJlYWNoIiwiYXJkdWlubyIsInVwZGF0ZSIsImRlbGV0ZSIsInNwbGljZSIsImNvbm5lY3QiLCJ0aGVuIiwiaW5mbyIsIkJyZXdCZW5jaCIsImV2ZW50Iiwic3JjRWxlbWVudCIsImlubmVySFRNTCIsImNhdGNoIiwiZXJyIiwidHBsaW5rIiwibG9naW4iLCJ1c2VyIiwicGFzcyIsInJlc3BvbnNlIiwidG9rZW4iLCJzY2FuIiwic2V0RXJyb3JNZXNzYWdlIiwibXNnIiwicGx1Z3MiLCJkZXZpY2VMaXN0IiwicGx1ZyIsInJlc3BvbnNlRGF0YSIsIkpTT04iLCJwYXJzZSIsInN5c3RlbSIsImdldF9zeXNpbmZvIiwiZW1ldGVyIiwiZ2V0X3JlYWx0aW1lIiwiZXJyX2NvZGUiLCJwb3dlciIsImRldmljZSIsInRvZ2dsZSIsIm9mZk9yT24iLCJyZWxheV9zdGF0ZSIsImFkZEtldHRsZSIsImZpbmQiLCJzdGlja3kiLCJwaW4iLCJhdXRvIiwiZHV0eUN5Y2xlIiwic2tldGNoIiwidGVtcCIsInZjYyIsImhpdCIsIm1lYXN1cmVkIiwicHJldmlvdXMiLCJhZGp1c3QiLCJkaWZmIiwicmF3Iiwidm9sdHMiLCJ2YWx1ZXMiLCJ0aW1lcnMiLCJrbm9iIiwiY29weSIsImRlZmF1bHRLbm9iT3B0aW9ucyIsIm1heCIsImNvdW50Iiwibm90aWZ5Iiwic2xhY2siLCJkd2VldCIsImhhc1N0aWNreUtldHRsZXMiLCJrZXR0bGVDb3VudCIsImFjdGl2ZUtldHRsZXMiLCJwaW5EaXNwbGF5IiwiZGV2aWNlSWQiLCJzdWJzdHIiLCJhbGlhcyIsInBpbkluVXNlIiwiYXJkdWlub0lkIiwiY2hhbmdlU2Vuc29yIiwic2Vuc29yVHlwZXMiLCJwZXJjZW50IiwiY3JlYXRlU2hhcmUiLCJicmV3ZXIiLCJlbWFpbCIsInNoYXJlX3N0YXR1cyIsInNoYXJlX3N1Y2Nlc3MiLCJzaGFyZV9saW5rIiwic2hhcmVUZXN0IiwidGVzdGluZyIsImh0dHBfY29kZSIsInB1YmxpYyIsImluZmx1eGRiIiwiYnJld2JlbmNoSG9zdGVkIiwicmVtb3ZlIiwiZGVmYXVsdFNldHRpbmdzIiwicGluZyIsIiQiLCJyZW1vdmVDbGFzcyIsImRiIiwiZGJzIiwiY29uY2F0IiwiYXBwbHkiLCJhZGRDbGFzcyIsImNyZWF0ZSIsIm1vbWVudCIsImZvcm1hdCIsImNyZWF0ZWQiLCJjcmVhdGVEQiIsImRhdGEiLCJyZXN1bHRzIiwicmVzZXRFcnJvciIsImNvbm5lY3RlZCIsInVzZXJuYW1lIiwiYXBpX2tleSIsImF1dGgiLCJyZWxheSIsInNhdmUiLCJrZXR0bGVSZXNwb25zZSIsIm1lcmdlIiwiY29uc29sZSIsInNlc3Npb25zIiwic2hhcmVBY2Nlc3MiLCJzaGFyZWQiLCJmcmFtZUVsZW1lbnQiLCJsb2FkU2hhcmVGaWxlIiwiY29udGVudHMiLCJub3RpZmljYXRpb25zIiwib24iLCJoaWdoIiwibG93IiwibGFzdCIsInN1YlRleHQiLCJlbmFibGVkIiwidGV4dCIsImNvbG9yIiwiZm9udCIsInByb2Nlc3NUZW1wcyIsImltcG9ydFJlY2lwZSIsIiRmaWxlQ29udGVudCIsIiRleHQiLCJmb3JtYXR0ZWRfY29udGVudCIsImZvcm1hdFhNTCIsImpzb25PYmoiLCJ4MmpzIiwiWDJKUyIsInhtbF9zdHIyanNvbiIsInJlY2lwZV9zdWNjZXNzIiwiUmVjaXBlcyIsIkRhdGEiLCJSZWNpcGUiLCJTZWxlY3Rpb25zIiwicmVjaXBlQmVlclNtaXRoIiwiUkVDSVBFUyIsIlJFQ0lQRSIsInJlY2lwZUJlZXJYTUwiLCJjYXRlZ29yeSIsImlidSIsImRhdGUiLCJncmFpbiIsImxhYmVsIiwiYW1vdW50IiwiYWRkVGltZXIiLCJub3RlcyIsImhvcCIsIm1pc2MiLCJ5ZWFzdCIsImxvYWRTdHlsZXMiLCJzdHlsZXMiLCJsb2FkQ29uZmlnIiwic29ydEJ5IiwidW5pcUJ5IiwiYWxsIiwiaW5pdCIsInRpbWVyIiwidGltZXJTdGFydCIsInF1ZXVlIiwidXAiLCJ1cGRhdGVLbm9iQ29weSIsInRydXN0QXNIdG1sIiwia2V5cyIsInN0YXR1c1RleHQiLCJzdHJpbmdpZnkiLCJ1cGRhdGVBcmR1aW5vU3RhdHVzIiwiZG9tYWluIiwic2tldGNoX3ZlcnNpb24iLCJ1cGRhdGVUZW1wIiwia2V5IiwidGVtcHMiLCJpc0VTUCIsInNoaWZ0IiwiYWx0aXR1ZGUiLCJwcmVzc3VyZSIsImN1cnJlbnRWYWx1ZSIsInVuaXRUeXBlIiwiZ2V0VGltZSIsImdldE5hdk9mZnNldCIsImdldEVsZW1lbnRCeUlkIiwib2Zmc2V0SGVpZ2h0Iiwic2VjIiwicmVtb3ZlVGltZXJzIiwiYnRuIiwiaGFzQ2xhc3MiLCJwYXJlbnQiLCJ0b2dnbGVQV00iLCJzc3IiLCJ0b2dnbGVLZXR0bGUiLCJoYXNTa2V0Y2hlcyIsImhhc0FTa2V0Y2giLCJzdGFydFN0b3BLZXR0bGUiLCJNYXRoIiwicm91bmQiLCJvZmYiLCJpbXBvcnRTZXR0aW5ncyIsInByb2ZpbGVDb250ZW50IiwiZXhwb3J0U2V0dGluZ3MiLCJpIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiY29tcGlsZVNrZXRjaCIsInNrZXRjaE5hbWUiLCJzZW5zb3JzIiwic2tldGNoZXMiLCJhcmR1aW5vTmFtZSIsImN1cnJlbnRTa2V0Y2giLCJhY3Rpb25zIiwidHJpZ2dlcnMiLCJESFQiLCJEUzE4QjIwIiwiQk1QIiwia2V0dGxlVHlwZSIsInVuc2hpZnQiLCJhIiwiZG93bmxvYWRTa2V0Y2giLCJoYXNUcmlnZ2VycyIsInRwbGlua19jb25uZWN0aW9uX3N0cmluZyIsImNvbm5lY3Rpb24iLCJhdXRvZ2VuIiwiZ2V0Iiwiam9pbiIsImNvbm5lY3Rpb25fc3RyaW5nIiwidHJpbSIsImFkZGl0aW9uYWxfcG9zdF9wYXJhbXMiLCJwb3J0Iiwic3RyZWFtU2tldGNoIiwiY3JlYXRlRWxlbWVudCIsInNldEF0dHJpYnV0ZSIsInN0eWxlIiwiZGlzcGxheSIsImJvZHkiLCJhcHBlbmRDaGlsZCIsImNsaWNrIiwicmVtb3ZlQ2hpbGQiLCJnZXRJUEFkZHJlc3MiLCJpcEFkZHJlc3MiLCJpcCIsImljb24iLCJuYXZpZ2F0b3IiLCJ2aWJyYXRlIiwic291bmRzIiwic25kIiwiQXVkaW8iLCJhbGVydCIsInBsYXkiLCJjbG9zZSIsIk5vdGlmaWNhdGlvbiIsInBlcm1pc3Npb24iLCJyZXF1ZXN0UGVybWlzc2lvbiIsInRyYWNrQ29sb3IiLCJiYXJDb2xvciIsImNoYW5nZUtldHRsZVR5cGUiLCJrZXR0bGVJbmRleCIsImZpbmRJbmRleCIsInVwZGF0ZVN0cmVhbXMiLCJjaGFuZ2VVbml0cyIsInYiLCJ0aW1lclJ1biIsIm5leHRUaW1lciIsImNhbmNlbCIsImludGVydmFsIiwiYWxsU2Vuc29ycyIsInBvbGxTZWNvbmRzIiwicmVtb3ZlS2V0dGxlIiwiJGluZGV4IiwiY2hhbmdlVmFsdWUiLCJmaWVsZCIsImxvYWRlZCIsInVwZGF0ZUxvY2FsIiwiZGlyZWN0aXZlIiwicmVzdHJpY3QiLCJzY29wZSIsIm1vZGVsIiwiY2hhbmdlIiwiZW50ZXIiLCJwbGFjZWhvbGRlciIsInRlbXBsYXRlIiwibGluayIsImF0dHJzIiwiZWRpdCIsImJpbmQiLCIkYXBwbHkiLCJjaGFyQ29kZSIsImtleUNvZGUiLCJuZ0VudGVyIiwiJHBhcnNlIiwiZm4iLCJvblJlYWRGaWxlIiwib25DaGFuZ2VFdmVudCIsInJlYWRlciIsIkZpbGVSZWFkZXIiLCJmaWxlcyIsImV4dGVuc2lvbiIsInBvcCIsInRvTG93ZXJDYXNlIiwib25sb2FkIiwib25Mb2FkRXZlbnQiLCJyZXN1bHQiLCJ2YWwiLCJyZWFkQXNUZXh0IiwiZnJvbU5vdyIsImNlbHNpdXMiLCJmYWhyZW5oZWl0IiwiZGVjaW1hbHMiLCJOdW1iZXIiLCJwaHJhc2UiLCJSZWdFeHAiLCJ0b1N0cmluZyIsImNoYXJBdCIsInRvVXBwZXJDYXNlIiwic2xpY2UiLCJmYWN0b3J5IiwibG9jYWxTdG9yYWdlIiwicmVtb3ZlSXRlbSIsImFjY2Vzc1Rva2VuIiwic2V0SXRlbSIsImdldEl0ZW0iLCJkZWJ1ZyIsInNob3ciLCJtaWxpdGFyeSIsImFyZWEiLCJyZWFkT25seSIsInRyYWNrV2lkdGgiLCJiYXJXaWR0aCIsImJhckNhcCIsImR5bmFtaWNPcHRpb25zIiwiZGlzcGxheVByZXZpb3VzIiwicHJldkJhckNvbG9yIiwid2ViaG9va191cmwiLCJxIiwiZGVmZXIiLCJwb3N0T2JqIiwicmVzb2x2ZSIsInJlamVjdCIsInByb21pc2UiLCJyZXF1ZXN0Iiwid2l0aENyZWRlbnRpYWxzIiwic2Vuc29yIiwiZGlnaXRhbFJlYWQiLCJxdWVyeSIsIm1kNSIsInNoIiwibGF0ZXN0IiwiYXBwTmFtZSIsInRlcm1JRCIsImFwcFZlciIsIm9zcGYiLCJuZXRUeXBlIiwibG9jYWxlIiwialF1ZXJ5IiwicGFyYW0iLCJsb2dpbl9wYXlsb2FkIiwiY29tbWFuZCIsInBheWxvYWQiLCJhcHBTZXJ2ZXJVcmwiLCJ1cGRhdGVkS2V0dGxlIiwic2Vzc2lvbklkIiwiYml0Y2FsYyIsImF2ZXJhZ2UiLCJmbWFwIiwieCIsImluX21pbiIsImluX21heCIsIm91dF9taW4iLCJvdXRfbWF4IiwiVEhFUk1JU1RPUk5PTUlOQUwiLCJURU1QRVJBVFVSRU5PTUlOQUwiLCJOVU1TQU1QTEVTIiwiQkNPRUZGSUNJRU5UIiwiU0VSSUVTUkVTSVNUT1IiLCJsbiIsImxvZyIsImtlbHZpbiIsInN0ZWluaGFydCIsImluZmx1eENvbm5lY3Rpb24iLCJzZXJpZXMiLCJ0aXRsZSIsImVuYWJsZSIsIm5vRGF0YSIsImhlaWdodCIsIm1hcmdpbiIsInRvcCIsInJpZ2h0IiwiYm90dG9tIiwibGVmdCIsImQiLCJ5IiwiZDMiLCJjYXRlZ29yeTEwIiwiZHVyYXRpb24iLCJ1c2VJbnRlcmFjdGl2ZUd1aWRlbGluZSIsImNsaXBWb3Jvbm9pIiwiaW50ZXJwb2xhdGUiLCJsZWdlbmQiLCJpc0FyZWEiLCJ4QXhpcyIsImF4aXNMYWJlbCIsInRpY2tGb3JtYXQiLCJ0aW1lIiwib3JpZW50IiwidGlja1BhZGRpbmciLCJheGlzTGFiZWxEaXN0YW5jZSIsInN0YWdnZXJMYWJlbHMiLCJmb3JjZVkiLCJ5QXhpcyIsInNob3dNYXhNaW4iLCJ0b0ZpeGVkIiwib3AiLCJmcCIsInBvdyIsInN1YnN0cmluZyIsIkZfUl9OQU1FIiwiRl9SX1NUWUxFIiwiRl9TX0NBVEVHT1JZIiwiRl9SX0RBVEUiLCJGX1JfQlJFV0VSIiwiRl9TX01BWF9PRyIsIkZfU19NSU5fT0ciLCJGX1NfTUFYX0ZHIiwiRl9TX01JTl9GRyIsIkZfU19NQVhfQUJWIiwiRl9TX01JTl9BQlYiLCJGX1NfTUFYX0lCVSIsInBhcnNlSW50IiwiRl9TX01JTl9JQlUiLCJJbmdyZWRpZW50cyIsIkdyYWluIiwiRl9HX05BTUUiLCJGX0dfQk9JTF9USU1FIiwiRl9HX0FNT1VOVCIsIkhvcHMiLCJGX0hfTkFNRSIsIkZfSF9EUllfSE9QX1RJTUUiLCJGX0hfQk9JTF9USU1FIiwiRl9IX0FNT1VOVCIsIk1pc2MiLCJGX01fTkFNRSIsIkZfTV9USU1FIiwiRl9NX0FNT1VOVCIsIlllYXN0IiwiRl9ZX0xBQiIsIkZfWV9QUk9EVUNUX0lEIiwiRl9ZX05BTUUiLCJtYXNoX3RpbWUiLCJOQU1FIiwiU1RZTEUiLCJDQVRFR09SWSIsIkJSRVdFUiIsIk9HIiwiRkciLCJJQlUiLCJBQlZfTUFYIiwiQUJWX01JTiIsIk1BU0giLCJNQVNIX1NURVBTIiwiTUFTSF9TVEVQIiwiU1RFUF9USU1FIiwiRkVSTUVOVEFCTEVTIiwiRkVSTUVOVEFCTEUiLCJBTU9VTlQiLCJIT1BTIiwiSE9QIiwiRk9STSIsIlVTRSIsIlRJTUUiLCJNSVNDUyIsIk1JU0MiLCJZRUFTVFMiLCJZRUFTVCIsImNvbnRlbnQiLCJodG1sY2hhcnMiLCJmIiwiciIsImNoYXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFFQSxrQkFBUUEsTUFBUixDQUFlLG1CQUFmLEVBQW9DLENBQ2xDLFdBRGtDLEVBRWpDLE1BRmlDLEVBR2pDLFNBSGlDLEVBSWpDLFVBSmlDLEVBS2pDLFNBTGlDLEVBTWpDLFVBTmlDLENBQXBDLEVBUUNDLE1BUkQsQ0FRUSxVQUFTQyxjQUFULEVBQXlCQyxrQkFBekIsRUFBNkNDLGFBQTdDLEVBQTREQyxpQkFBNUQsRUFBK0VDLGdCQUEv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RUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF2UWMsRUF3UWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF4UWMsRUF5UWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF6UWMsRUEwUWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUExUWMsRUEyUWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEzUWMsRUE0UWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE1UWMsRUE2UWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE3UWMsRUE4UWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE5UWMsRUErUWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEvUWMsRUFnUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFoUmMsRUFpUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFqUmMsRUFrUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFsUmMsRUFtUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFuUmMsRUFvUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFwUmMsRUFxUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFyUmMsRUFzUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF0UmMsRUF1UmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF2UmMsRUF3UmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF4UmMsRUF5UmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF6UmMsRUEwUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUExUmMsRUEyUmQs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RyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBcmZjLEVBc2ZkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXRmYyxFQXVmZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXZmYyxFQXdmZCxFQUFDRCxHQUFHLE9BQUosRUFBYUMsR0FBRyxLQUFoQixFQXhmYyxFQXlmZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXpmYyxFQTBmZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQTFmYyxFQTJmZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQTNmYyxDQUFoQjs7QUE4ZkFwaUIsUUFBRStELElBQUYsQ0FBT21lLFNBQVAsRUFBa0IsVUFBU0csSUFBVCxFQUFlO0FBQy9CLFlBQUdKLFFBQVFyaUIsT0FBUixDQUFnQnlpQixLQUFLRixDQUFyQixNQUE0QixDQUFDLENBQWhDLEVBQWtDO0FBQ2hDRixvQkFBVUEsUUFBUXRpQixPQUFSLENBQWdCbVksT0FBT3VLLEtBQUtGLENBQVosRUFBYyxHQUFkLENBQWhCLEVBQW9DRSxLQUFLRCxDQUF6QyxDQUFWO0FBQ0Q7QUFDRixPQUpEO0FBS0EsYUFBT0gsT0FBUDtBQUNEO0FBL3BESSxHQUFQO0FBaXFERCxDQXBxREQsRSIsImZpbGUiOiJqcy9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFuZ3VsYXIgZnJvbSAnYW5ndWxhcic7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICdib290c3RyYXAnO1xuXG5hbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InLCBbXG4gICd1aS5yb3V0ZXInXG4gICwnbnZkMydcbiAgLCduZ1RvdWNoJ1xuICAsJ2R1U2Nyb2xsJ1xuICAsJ3VpLmtub2InXG4gICwncnpNb2R1bGUnXG5dKVxuLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyLCAkaHR0cFByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJGNvbXBpbGVQcm92aWRlcikge1xuXG4gICRodHRwUHJvdmlkZXIuZGVmYXVsdHMudXNlWERvbWFpbiA9IHRydWU7XG4gICRodHRwUHJvdmlkZXIuZGVmYXVsdHMuaGVhZGVycy5jb21tb24gPSAnQ29udGVudC1UeXBlOiBhcHBsaWNhdGlvbi9qc29uJztcbiAgZGVsZXRlICRodHRwUHJvdmlkZXIuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ1gtUmVxdWVzdGVkLVdpdGgnXTtcblxuICAkbG9jYXRpb25Qcm92aWRlci5oYXNoUHJlZml4KCcnKTtcbiAgJGNvbXBpbGVQcm92aWRlci5hSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCgvXlxccyooaHR0cHM/fGZ0cHxtYWlsdG98dGVsfGZpbGV8YmxvYnxjaHJvbWUtZXh0ZW5zaW9ufGRhdGF8bG9jYWwpOi8pO1xuXG4gICRzdGF0ZVByb3ZpZGVyXG4gICAgLnN0YXRlKCdob21lJywge1xuICAgICAgdXJsOiAnJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgnc2hhcmUnLCB7XG4gICAgICB1cmw6ICcvc2gvOmZpbGUnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdyZXNldCcsIHtcbiAgICAgIHVybDogJy9yZXNldCcsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ290aGVyd2lzZScsIHtcbiAgICAgdXJsOiAnKnBhdGgnLFxuICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL25vdC1mb3VuZC5odG1sJ1xuICAgfSk7XG5cbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2FwcC5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uY29udHJvbGxlcignbWFpbkN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRzdGF0ZSwgJGZpbHRlciwgJHRpbWVvdXQsICRpbnRlcnZhbCwgJHEsICRodHRwLCAkc2NlLCBCcmV3U2VydmljZSl7XG5cbiRzY29wZS5jbGVhclNldHRpbmdzID0gZnVuY3Rpb24oZSl7XG4gIGlmKGUpe1xuICAgIGFuZ3VsYXIuZWxlbWVudChlLnRhcmdldCkuaHRtbCgnUmVtb3ZpbmcuLi4nKTtcbiAgfVxuICBCcmV3U2VydmljZS5jbGVhcigpO1xuICB3aW5kb3cubG9jYXRpb24uaHJlZj0nLyc7XG59O1xuXG5pZiggJHN0YXRlLmN1cnJlbnQubmFtZSA9PSAncmVzZXQnKVxuICAkc2NvcGUuY2xlYXJTZXR0aW5ncygpO1xuXG52YXIgbm90aWZpY2F0aW9uID0gbnVsbCxcbiAgcmVzZXRDaGFydCA9IDEwMCxcbiAgdGltZW91dCA9IG51bGw7Ly9yZXNldCBjaGFydCBhZnRlciAxMDAgcG9sbHNcblxuJHNjb3BlLkJyZXdTZXJ2aWNlID0gQnJld1NlcnZpY2U7XG4kc2NvcGUuc2l0ZSA9IHtodHRwczogISEoZG9jdW1lbnQubG9jYXRpb24ucHJvdG9jb2w9PSdodHRwczonKVxuICAsIGh0dHBzX3VybDogYGh0dHBzOi8vJHtkb2N1bWVudC5sb2NhdGlvbi5ob3N0fWBcbn07XG4kc2NvcGUuZXNwID0ge1xuICB0eXBlOiAnODI2NicsXG4gIHNzaWQ6ICcnLFxuICBzc2lkX3Bhc3M6ICcnLFxuICBob3N0bmFtZTogJycsXG4gIGF1dG9jb25uZWN0OiBmYWxzZVxufTtcbiRzY29wZS5ob3BzO1xuJHNjb3BlLmdyYWlucztcbiRzY29wZS53YXRlcjtcbiRzY29wZS5sb3ZpYm9uZDtcbiRzY29wZS5wa2c7XG4kc2NvcGUua2V0dGxlVHlwZXMgPSBCcmV3U2VydmljZS5rZXR0bGVUeXBlcygpO1xuJHNjb3BlLnNob3dTZXR0aW5ncyA9IHRydWU7XG4kc2NvcGUuZXJyb3IgPSB7bWVzc2FnZTogJycsIHR5cGU6ICdkYW5nZXInfTtcbiRzY29wZS5zbGlkZXIgPSB7XG4gIG1pbjogMCxcbiAgb3B0aW9uczoge1xuICAgIGZsb29yOiAwLFxuICAgIGNlaWw6IDEwMCxcbiAgICBzdGVwOiA1LFxuICAgIHRyYW5zbGF0ZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGAke3ZhbHVlfSVgO1xuICAgIH0sXG4gICAgb25FbmQ6IGZ1bmN0aW9uKGtldHRsZUlkLCBtb2RlbFZhbHVlLCBoaWdoVmFsdWUsIHBvaW50ZXJUeXBlKXtcbiAgICAgIHZhciBrZXR0bGUgPSBrZXR0bGVJZC5zcGxpdCgnXycpO1xuICAgICAgdmFyIGs7XG5cbiAgICAgIHN3aXRjaCAoa2V0dGxlWzBdKSB7XG4gICAgICAgIGNhc2UgJ2hlYXQnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmhlYXRlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY29vbCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uY29vbGVyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5wdW1wO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZighaylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYoJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5hY3RpdmUgJiYgay5wd20gJiYgay5ydW5uaW5nKXtcbiAgICAgICAgcmV0dXJuICRzY29wZS50b2dnbGVSZWxheSgkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLCBrLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbiRzY29wZS5nZXRLZXR0bGVTbGlkZXJPcHRpb25zID0gZnVuY3Rpb24odHlwZSwgaW5kZXgpe1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbigkc2NvcGUuc2xpZGVyLm9wdGlvbnMsIHtpZDogYCR7dHlwZX1fJHtpbmRleH1gfSk7XG59XG5cbiRzY29wZS5nZXRMb3ZpYm9uZENvbG9yID0gZnVuY3Rpb24ocmFuZ2Upe1xuICByYW5nZSA9IHJhbmdlLnJlcGxhY2UoL8KwL2csJycpLnJlcGxhY2UoLyAvZywnJyk7XG4gIGlmKHJhbmdlLmluZGV4T2YoJy0nKSE9PS0xKXtcbiAgICB2YXIgckFycj1yYW5nZS5zcGxpdCgnLScpO1xuICAgIHJhbmdlID0gKHBhcnNlRmxvYXQockFyclswXSkrcGFyc2VGbG9hdChyQXJyWzFdKSkvMjtcbiAgfSBlbHNlIHtcbiAgICByYW5nZSA9IHBhcnNlRmxvYXQocmFuZ2UpO1xuICB9XG4gIGlmKCFyYW5nZSlcbiAgICByZXR1cm4gJyc7XG4gIHZhciBsID0gXy5maWx0ZXIoJHNjb3BlLmxvdmlib25kLCBmdW5jdGlvbihpdGVtKXtcbiAgICByZXR1cm4gKGl0ZW0uc3JtIDw9IHJhbmdlKSA/IGl0ZW0uaGV4IDogJyc7XG4gIH0pO1xuICBpZighIWwubGVuZ3RoKVxuICAgIHJldHVybiBsW2wubGVuZ3RoLTFdLmhleDtcbiAgcmV0dXJuICcnO1xufTtcblxuLy9kZWZhdWx0IHNldHRpbmdzIHZhbHVlc1xuJHNjb3BlLnNldHRpbmdzID0gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NldHRpbmdzJykgfHwgQnJld1NlcnZpY2UucmVzZXQoKTtcbi8vIGdlbmVyYWwgY2hlY2sgYW5kIHVwZGF0ZVxuaWYoISRzY29wZS5zZXR0aW5ncy5nZW5lcmFsKVxuICByZXR1cm4gJHNjb3BlLmNsZWFyU2V0dGluZ3MoKTtcbiRzY29wZS5jaGFydE9wdGlvbnMgPSBCcmV3U2VydmljZS5jaGFydE9wdGlvbnMoe3VuaXQ6ICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQsIGNoYXJ0OiAkc2NvcGUuc2V0dGluZ3MuY2hhcnQsIHNlc3Npb246ICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnNlc3Npb259KTtcbiRzY29wZS5rZXR0bGVzID0gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ2tldHRsZXMnKSB8fCBCcmV3U2VydmljZS5kZWZhdWx0S2V0dGxlcygpO1xuJHNjb3BlLnNoYXJlID0gKCEkc3RhdGUucGFyYW1zLmZpbGUgJiYgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJykpID8gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJykgOiB7XG4gICAgICBmaWxlOiAkc3RhdGUucGFyYW1zLmZpbGUgfHwgbnVsbFxuICAgICAgLCBwYXNzd29yZDogbnVsbFxuICAgICAgLCBuZWVkUGFzc3dvcmQ6IGZhbHNlXG4gICAgICAsIGFjY2VzczogJ3JlYWRPbmx5J1xuICAgICAgLCBkZWxldGVBZnRlcjogMTRcbiAgfTtcblxuJHNjb3BlLnN1bVZhbHVlcyA9IGZ1bmN0aW9uKG9iail7XG4gIHJldHVybiBfLnN1bUJ5KG9iaiwnYW1vdW50Jyk7XG59XG5cbi8vIGluaXQgY2FsYyB2YWx1ZXNcbiRzY29wZS51cGRhdGVBQlYgPSBmdW5jdGlvbigpe1xuICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlPT0nZ3Jhdml0eScpe1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICBlbHNlXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidmEoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidyA9IEJyZXdTZXJ2aWNlLmFidygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiwkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmF0dGVudWF0aW9uID0gQnJld1NlcnZpY2UuYXR0ZW51YXRpb24oQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKVxuICAgICAgLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9IGVsc2Uge1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgIGVsc2VcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2YShCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYncgPSBCcmV3U2VydmljZS5hYncoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYsQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYXR0ZW51YXRpb24gPSBCcmV3U2VydmljZS5hdHRlbnVhdGlvbigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZylcbiAgICAgICxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gIH1cbn07XG5cbiRzY29wZS5jaGFuZ2VNZXRob2QgPSBmdW5jdGlvbihtZXRob2Qpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZCA9IG1ldGhvZDtcbiAgJHNjb3BlLnVwZGF0ZUFCVigpO1xufTtcblxuJHNjb3BlLmNoYW5nZVNjYWxlID0gZnVuY3Rpb24oc2NhbGUpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlID0gc2NhbGU7XG4gIGlmKHNjYWxlPT0nZ3Jhdml0eScpe1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSBCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH0gZWxzZSB7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyA9IEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSBCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfVxufTtcblxuJHNjb3BlLmdldFN0YXR1c0NsYXNzID0gZnVuY3Rpb24oc3RhdHVzKXtcbiAgaWYoc3RhdHVzID09ICdDb25uZWN0ZWQnKVxuICAgIHJldHVybiAnc3VjY2Vzcyc7XG4gIGVsc2UgaWYoXy5lbmRzV2l0aChzdGF0dXMsJ2luZycpKVxuICAgIHJldHVybiAnc2Vjb25kYXJ5JztcbiAgZWxzZVxuICAgIHJldHVybiAnZGFuZ2VyJztcbn1cblxuJHNjb3BlLnVwZGF0ZUFCVigpO1xuXG4gICRzY29wZS5nZXRQb3J0UmFuZ2UgPSBmdW5jdGlvbihudW1iZXIpe1xuICAgICAgbnVtYmVyKys7XG4gICAgICByZXR1cm4gQXJyYXkobnVtYmVyKS5maWxsKCkubWFwKChfLCBpZHgpID0+IDAgKyBpZHgpO1xuICB9O1xuXG4gICRzY29wZS5hcmR1aW5vcyA9IHtcbiAgICBhZGQ6ICgpID0+IHtcbiAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcykgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zID0gW107XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MucHVzaCh7XG4gICAgICAgIGlkOiBidG9hKG5vdysnJyskc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MubGVuZ3RoKzEpLFxuICAgICAgICB1cmw6ICdhcmR1aW5vLmxvY2FsJyxcbiAgICAgICAgYm9hcmQ6ICcnLFxuICAgICAgICBhbmFsb2c6IDUsXG4gICAgICAgIGRpZ2l0YWw6IDEzLFxuICAgICAgICBhZGM6IDAsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIHZlcnNpb246ICcnLFxuICAgICAgICBzdGF0dXM6IHtlcnJvcjogJycsZHQ6ICcnLG1lc3NhZ2U6Jyd9XG4gICAgICB9KTtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKVxuICAgICAgICAgIGtldHRsZS5hcmR1aW5vID0gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zWzBdO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICB1cGRhdGU6IChhcmR1aW5vKSA9PiB7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIGlmKGtldHRsZS5hcmR1aW5vICYmIGtldHRsZS5hcmR1aW5vLmlkID09IGFyZHVpbm8uaWQpXG4gICAgICAgICAga2V0dGxlLmFyZHVpbm8gPSBhcmR1aW5vO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBkZWxldGU6IChpbmRleCwgYXJkdWlubykgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLnNwbGljZShpbmRleCwgMSk7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIGlmKGtldHRsZS5hcmR1aW5vICYmIGtldHRsZS5hcmR1aW5vLmlkID09IGFyZHVpbm8uaWQpXG4gICAgICAgICAgZGVsZXRlIGtldHRsZS5hcmR1aW5vO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBjb25uZWN0OiAoYXJkdWlubykgPT4ge1xuICAgICAgYXJkdWluby5zdGF0dXMuZHQgPSAnJztcbiAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJ0Nvbm5lY3RpbmcuLi4nO1xuICAgICAgQnJld1NlcnZpY2UuY29ubmVjdChhcmR1aW5vKVxuICAgICAgICAudGhlbihpbmZvID0+IHtcbiAgICAgICAgICBpZihpbmZvICYmIGluZm8uQnJld0JlbmNoKXtcbiAgICAgICAgICAgIGV2ZW50LnNyY0VsZW1lbnQuaW5uZXJIVE1MID0gJ0Nvbm5lY3QnO1xuICAgICAgICAgICAgYXJkdWluby5ib2FyZCA9IGluZm8uQnJld0JlbmNoLmJvYXJkO1xuICAgICAgICAgICAgYXJkdWluby52ZXJzaW9uID0gaW5mby5CcmV3QmVuY2gudmVyc2lvbjtcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmR0ID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJyc7XG4gICAgICAgICAgICBpZihhcmR1aW5vLmJvYXJkLmluZGV4T2YoJ0VTUDMyJykgPT0gMCl7XG4gICAgICAgICAgICAgIGFyZHVpbm8uYW5hbG9nID0gMDtcbiAgICAgICAgICAgICAgYXJkdWluby5kaWdpdGFsID0gMzM7XG4gICAgICAgICAgICB9IGVsc2UgaWYoYXJkdWluby5ib2FyZC5pbmRleE9mKCdFU1A4MjY2JykgPT0gMCl7XG4gICAgICAgICAgICAgIGFyZHVpbm8uYW5hbG9nID0gMDtcbiAgICAgICAgICAgICAgYXJkdWluby5kaWdpdGFsID0gMTA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBpZihlcnIgJiYgZXJyLnN0YXR1cyA9PSAtMSl7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnQ291bGQgbm90IGNvbm5lY3QnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50cGxpbmsgPSB7XG4gICAgbG9naW46ICgpID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsuc3RhdHVzID0gJ0Nvbm5lY3RpbmcnO1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkubG9naW4oJHNjb3BlLnNldHRpbmdzLnRwbGluay51c2VyLCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGFzcylcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKHJlc3BvbnNlLnRva2VuKXtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsuc3RhdHVzID0gJ0Nvbm5lY3RlZCc7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnRva2VuID0gcmVzcG9uc2UudG9rZW47XG4gICAgICAgICAgICAkc2NvcGUudHBsaW5rLnNjYW4ocmVzcG9uc2UudG9rZW4pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLm1zZyB8fCBlcnIpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHNjYW46ICh0b2tlbikgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyA9IFtdO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnU2Nhbm5pbmcnO1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuc2Nhbih0b2tlbikudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGlmKHJlc3BvbnNlLmRldmljZUxpc3Qpe1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsuc3RhdHVzID0gJ0Nvbm5lY3RlZCc7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyA9IHJlc3BvbnNlLmRldmljZUxpc3Q7XG4gICAgICAgICAgLy8gZ2V0IGRldmljZSBpbmZvIGlmIG9ubGluZSAoaWUuIHN0YXR1cz09MSlcbiAgICAgICAgICBfLmVhY2goJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncywgcGx1ZyA9PiB7XG4gICAgICAgICAgICBpZighIXBsdWcuc3RhdHVzKXtcbiAgICAgICAgICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuaW5mbyhwbHVnKS50aGVuKGluZm8gPT4ge1xuICAgICAgICAgICAgICAgIGlmKGluZm8gJiYgaW5mby5yZXNwb25zZURhdGEpe1xuICAgICAgICAgICAgICAgICAgcGx1Zy5pbmZvID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuc3lzdGVtLmdldF9zeXNpbmZvO1xuICAgICAgICAgICAgICAgICAgaWYoSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZS5lcnJfY29kZSA9PSAwKXtcbiAgICAgICAgICAgICAgICAgICAgcGx1Zy5wb3dlciA9IEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLmVtZXRlci5nZXRfcmVhbHRpbWU7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwbHVnLnBvd2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGluZm86IChkZXZpY2UpID0+IHtcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8oZGV2aWNlKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICB0b2dnbGU6IChkZXZpY2UpID0+IHtcbiAgICAgIHZhciBvZmZPck9uID0gZGV2aWNlLmluZm8ucmVsYXlfc3RhdGUgPT0gMSA/IDAgOiAxO1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkudG9nZ2xlKGRldmljZSwgb2ZmT3JPbikudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGRldmljZS5pbmZvLnJlbGF5X3N0YXRlID0gb2ZmT3JPbjtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfSkudGhlbih0b2dnbGVSZXNwb25zZSA9PiB7XG4gICAgICAgICR0aW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAvLyB1cGRhdGUgdGhlIGluZm9cbiAgICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkuaW5mbyhkZXZpY2UpLnRoZW4oaW5mbyA9PiB7XG4gICAgICAgICAgICBpZihpbmZvICYmIGluZm8ucmVzcG9uc2VEYXRhKXtcbiAgICAgICAgICAgICAgZGV2aWNlLmluZm8gPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5zeXN0ZW0uZ2V0X3N5c2luZm87XG4gICAgICAgICAgICAgIGlmKEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLmVtZXRlci5nZXRfcmVhbHRpbWUuZXJyX2NvZGUgPT0gMCl7XG4gICAgICAgICAgICAgICAgZGV2aWNlLnBvd2VyID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXZpY2UucG93ZXIgPSBudWxsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBkZXZpY2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZGV2aWNlO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9LCAxMDAwKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuYWRkS2V0dGxlID0gZnVuY3Rpb24odHlwZSl7XG4gICAgaWYoISRzY29wZS5rZXR0bGVzKSAkc2NvcGUua2V0dGxlcyA9IFtdO1xuICAgIHZhciBhcmR1aW5vID0gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLmxlbmd0aCA/ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vc1swXSA6IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX07XG4gICAgJHNjb3BlLmtldHRsZXMucHVzaCh7XG4gICAgICAgIG5hbWU6IHR5cGUgPyBfLmZpbmQoJHNjb3BlLmtldHRsZVR5cGVzLHt0eXBlOiB0eXBlfSkubmFtZSA6ICRzY29wZS5rZXR0bGVUeXBlc1swXS5uYW1lXG4gICAgICAgICxpZDogbnVsbFxuICAgICAgICAsdHlwZTogdHlwZSB8fCAkc2NvcGUua2V0dGxlVHlwZXNbMF0udHlwZVxuICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAsaGVhdGVyOiB7cGluOidENicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgLHB1bXA6IHtwaW46J0Q3JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAsdGVtcDoge3BpbjonQTAnLHZjYzonJyxpbmRleDonJyx0eXBlOidUaGVybWlzdG9yJyxhZGM6ZmFsc2UsaGl0OmZhbHNlLGN1cnJlbnQ6MCxtZWFzdXJlZDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OiRzY29wZS5rZXR0bGVUeXBlc1swXS50YXJnZXQsZGlmZjokc2NvcGUua2V0dGxlVHlwZXNbMF0uZGlmZixyYXc6MCx2b2x0czowfVxuICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KEJyZXdTZXJ2aWNlLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDokc2NvcGUua2V0dGxlVHlwZXNbMF0udGFyZ2V0KyRzY29wZS5rZXR0bGVUeXBlc1swXS5kaWZmfSlcbiAgICAgICAgLGFyZHVpbm86IGFyZHVpbm9cbiAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2UsIGR3ZWV0OiBmYWxzZSwgc3RyZWFtczogZmFsc2V9XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmhhc1N0aWNreUtldHRsZXMgPSBmdW5jdGlvbih0eXBlKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMsIHsnc3RpY2t5JzogdHJ1ZX0pLmxlbmd0aDtcbiAgfTtcblxuICAkc2NvcGUua2V0dGxlQ291bnQgPSBmdW5jdGlvbih0eXBlKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMsIHsndHlwZSc6IHR5cGV9KS5sZW5ndGg7XG4gIH07XG5cbiAgJHNjb3BlLmFjdGl2ZUtldHRsZXMgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7J2FjdGl2ZSc6IHRydWV9KS5sZW5ndGg7XG4gIH07XG5cbiAgJHNjb3BlLnBpbkRpc3BsYXkgPSBmdW5jdGlvbihwaW4pe1xuICAgICAgaWYoIHBpbi5pbmRleE9mKCdUUC0nKT09PTAgKXtcbiAgICAgICAgdmFyIGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBwaW4uc3Vic3RyKDMpfSlbMF07XG4gICAgICAgIHJldHVybiBkZXZpY2UgPyBkZXZpY2UuYWxpYXMgOiAnJztcbiAgICAgIH0gZWxzZVxuICAgICAgICByZXR1cm4gcGluO1xuICB9O1xuXG4gICRzY29wZS5waW5JblVzZSA9IGZ1bmN0aW9uKHBpbixhcmR1aW5vSWQpe1xuICAgIHZhciBrZXR0bGUgPSBfLmZpbmQoJHNjb3BlLmtldHRsZXMsIGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICByZXR1cm4gKFxuICAgICAgICAoa2V0dGxlLmFyZHVpbm8uaWQ9PWFyZHVpbm9JZCkgJiZcbiAgICAgICAgKFxuICAgICAgICAgIChrZXR0bGUudGVtcC5waW49PXBpbikgfHxcbiAgICAgICAgICAoa2V0dGxlLnRlbXAudmNjPT1waW4pIHx8XG4gICAgICAgICAgKGtldHRsZS5oZWF0ZXIucGluPT1waW4pIHx8XG4gICAgICAgICAgKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5waW49PXBpbikgfHxcbiAgICAgICAgICAoIWtldHRsZS5jb29sZXIgJiYga2V0dGxlLnB1bXAucGluPT1waW4pXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGtldHRsZSB8fCBmYWxzZTtcbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlU2Vuc29yID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICBpZighIUJyZXdTZXJ2aWNlLnNlbnNvclR5cGVzKGtldHRsZS50ZW1wLnR5cGUpLnBlcmNlbnQpe1xuICAgICAga2V0dGxlLmtub2IudW5pdCA9ICdcXHUwMDI1JztcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLmtub2IudW5pdCA9ICdcXHUwMEIwJztcbiAgICB9XG4gICAga2V0dGxlLnRlbXAudmNjID0gJyc7XG4gICAga2V0dGxlLnRlbXAuaW5kZXggPSAnJztcbiAgfTtcblxuICAkc2NvcGUuY3JlYXRlU2hhcmUgPSBmdW5jdGlvbigpe1xuICAgIGlmKCEkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlci5uYW1lIHx8ICEkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlci5lbWFpbClcbiAgICAgIHJldHVybjtcbiAgICAkc2NvcGUuc2hhcmVfc3RhdHVzID0gJ0NyZWF0aW5nIHNoYXJlIGxpbmsuLi4nO1xuICAgIHJldHVybiBCcmV3U2VydmljZS5jcmVhdGVTaGFyZSgkc2NvcGUuc2hhcmUpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICBpZihyZXNwb25zZS5zaGFyZSAmJiByZXNwb25zZS5zaGFyZS51cmwpe1xuICAgICAgICAgICRzY29wZS5zaGFyZV9zdGF0dXMgPSAnJztcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfc3VjY2VzcyA9IHRydWU7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX2xpbmsgPSByZXNwb25zZS5zaGFyZS51cmw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBCcmV3U2VydmljZS5zZXR0aW5ncygnc2hhcmUnLCRzY29wZS5zaGFyZSk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICRzY29wZS5zaGFyZV9zdGF0dXMgPSBlcnI7XG4gICAgICAgICRzY29wZS5zaGFyZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzaGFyZScsJHNjb3BlLnNoYXJlKTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5zaGFyZVRlc3QgPSBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICBhcmR1aW5vLnRlc3RpbmcgPSB0cnVlO1xuICAgIEJyZXdTZXJ2aWNlLnNoYXJlVGVzdChhcmR1aW5vKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICBhcmR1aW5vLnRlc3RpbmcgPSBmYWxzZTtcbiAgICAgICAgaWYocmVzcG9uc2UuaHR0cF9jb2RlID09IDIwMClcbiAgICAgICAgICBhcmR1aW5vLnB1YmxpYyA9IHRydWU7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBhcmR1aW5vLnB1YmxpYyA9IGZhbHNlO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBhcmR1aW5vLnRlc3RpbmcgPSBmYWxzZTtcbiAgICAgICAgYXJkdWluby5wdWJsaWMgPSBmYWxzZTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5pbmZsdXhkYiA9IHtcbiAgICBicmV3YmVuY2hIb3N0ZWQ6ICgpID0+IHtcbiAgICAgIHJldHVybiAoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVybC5pbmRleE9mKCdzdHJlYW1zLmJyZXdiZW5jaC5jbycpICE9PSAtMSk7XG4gICAgfSxcbiAgICByZW1vdmU6ICgpID0+IHtcbiAgICAgIHZhciBkZWZhdWx0U2V0dGluZ3MgPSBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiID0gZGVmYXVsdFNldHRpbmdzLmluZmx1eGRiO1xuICAgIH0sXG4gICAgY29ubmVjdDogKCkgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnN0YXR1cyA9ICdDb25uZWN0aW5nJztcbiAgICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkucGluZygkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZihyZXNwb25zZS5zdGF0dXMgPT0gMjA0IHx8IHJlc3BvbnNlLnN0YXR1cyA9PSAyMDApe1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykucmVtb3ZlQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgICAgIGlmKCRzY29wZS5pbmZsdXhkYi5icmV3YmVuY2hIb3N0ZWQoKSl7XG4gICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiA9ICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy9nZXQgbGlzdCBvZiBkYXRhYmFzZXNcbiAgICAgICAgICAgICAgQnJld1NlcnZpY2UuaW5mbHV4ZGIoKS5kYnMoKVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYocmVzcG9uc2UubGVuZ3RoKXtcbiAgICAgICAgICAgICAgICAgIHZhciBkYnMgPSBbXS5jb25jYXQuYXBwbHkoW10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYnMgPSBfLnJlbW92ZShkYnMsIChkYikgPT4gZGIgIT0gXCJfaW50ZXJuYWxcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBjcmVhdGU6ICgpID0+IHtcbiAgICAgIHZhciBkYiA9ICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiB8fCAnc2Vzc2lvbi0nK21vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNyZWF0ZWQgPSBmYWxzZTtcbiAgICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkuY3JlYXRlREIoZGIpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAvLyBwcm9tcHQgZm9yIHBhc3N3b3JkXG4gICAgICAgICAgaWYocmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS5kYXRhLnJlc3VsdHMgJiYgcmVzcG9uc2UuZGF0YS5yZXN1bHRzLmxlbmd0aCl7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgPSBkYjtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVzZXInKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiUGFzcycpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBjcmVhdGluZyB0aGUgZGF0YWJhc2UuXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgaWYoZXJyLnN0YXR1cyAmJiAoZXJyLnN0YXR1cyA9PSA0MDEgfHwgZXJyLnN0YXR1cyA9PSA0MDMpKXtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVzZXInKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiUGFzcycpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiRW50ZXIgeW91ciBVc2VybmFtZSBhbmQgUGFzc3dvcmQgZm9yIEluZmx1eERCXCIpO1xuICAgICAgICAgIH0gZWxzZSBpZihlcnIpe1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBjcmVhdGluZyB0aGUgZGF0YWJhc2UuXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgIH1cbiAgfTtcblxuICAkc2NvcGUuc3RyZWFtcyA9IHtcbiAgICBjb25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgIHJldHVybiAoISEkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy51c2VybmFtZSAmJlxuICAgICAgICAhISRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLmFwaV9rZXkgJiZcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuc3RhdHVzID09ICdDb25uZWN0ZWQnXG4gICAgICApO1xuICAgIH0sXG4gICAgcmVtb3ZlOiAoKSA9PiB7XG4gICAgICB2YXIgZGVmYXVsdFNldHRpbmdzID0gQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zID0gZGVmYXVsdFNldHRpbmdzLnN0cmVhbXM7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIGtldHRsZS5ub3RpZnkuc3RyZWFtcyA9IGZhbHNlO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBjb25uZWN0OiAoKSA9PiB7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMudXNlcm5hbWUgfHwgISRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLmFwaV9rZXkpXG4gICAgICAgIHJldHVybjtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnN0YXR1cyA9ICdDb25uZWN0aW5nJztcbiAgICAgIHJldHVybiBCcmV3U2VydmljZS5zdHJlYW1zKCkuYXV0aCh0cnVlKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuc3RhdHVzID0gJ0Nvbm5lY3RlZCc7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAga2V0dGxlczogKGtldHRsZSwgcmVsYXkpID0+IHtcbiAgICAgIGlmKHJlbGF5KXtcbiAgICAgICAga2V0dGxlW3JlbGF5XS5za2V0Y2ggPSAha2V0dGxlW3JlbGF5XS5za2V0Y2g7XG4gICAgICAgIGlmKCFrZXR0bGUubm90aWZ5LnN0cmVhbXMpXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAga2V0dGxlLm1lc3NhZ2UubG9jYXRpb24gPSAnc2tldGNoZXMnO1xuICAgICAga2V0dGxlLm1lc3NhZ2UudHlwZSA9ICdpbmZvJztcbiAgICAgIGtldHRsZS5tZXNzYWdlLnN0YXR1cyA9IDA7XG4gICAgICByZXR1cm4gQnJld1NlcnZpY2Uuc3RyZWFtcygpLmtldHRsZXMuc2F2ZShrZXR0bGUpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICB2YXIga2V0dGxlUmVzcG9uc2UgPSByZXNwb25zZS5rZXR0bGU7XG4gICAgICAgICAgLy8gdXBkYXRlIGtldHRsZSB2YXJzXG4gICAgICAgICAga2V0dGxlLmlkID0ga2V0dGxlUmVzcG9uc2UuaWQ7XG4gICAgICAgICAgLy8gdXBkYXRlIGFyZHVpbm8gaWRcbiAgICAgICAgICBfLmVhY2goJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLCBhcmR1aW5vID0+IHtcbiAgICAgICAgICAgIGlmKGFyZHVpbm8uaWQgPT0ga2V0dGxlLmFyZHVpbm8uaWQpXG4gICAgICAgICAgICAgIGFyZHVpbm8uaWQgPSBrZXR0bGVSZXNwb25zZS5kZXZpY2VJZDtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBrZXR0bGUuYXJkdWluby5pZCA9IGtldHRsZVJlc3BvbnNlLmRldmljZUlkO1xuICAgICAgICAgIC8vIHVwZGF0ZSBzZXNzaW9uIHZhcnNcbiAgICAgICAgICBfLm1lcmdlKCRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnNlc3Npb24sIGtldHRsZVJlc3BvbnNlLnNlc3Npb24pO1xuXG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UudHlwZSA9ICdzdWNjZXNzJztcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS5zdGF0dXMgPSAyO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBrZXR0bGUubm90aWZ5LnN0cmVhbXMgPSAha2V0dGxlLm5vdGlmeS5zdHJlYW1zO1xuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLnN0YXR1cyA9IDE7XG4gICAgICAgICAgaWYoZXJyICYmIGVyci5kYXRhICYmIGVyci5kYXRhLmVycm9yICYmIGVyci5kYXRhLmVycm9yLm1lc3NhZ2Upe1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIuZGF0YS5lcnJvci5tZXNzYWdlLCBrZXR0bGUpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignQnJld0JlbmNoIFN0cmVhbXMgRXJyb3InLCBlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBzZXNzaW9uczoge1xuICAgICAgc2F2ZTogKCkgPT4ge1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2Uuc3RyZWFtcygpLnNlc3Npb25zLnNhdmUoJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuc2Vzc2lvbilcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG5cbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnNoYXJlQWNjZXNzID0gZnVuY3Rpb24oYWNjZXNzKXtcbiAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnNoYXJlZCl7XG4gICAgICAgIGlmKGFjY2Vzcyl7XG4gICAgICAgICAgaWYoYWNjZXNzID09ICdlbWJlZCcpe1xuICAgICAgICAgICAgcmV0dXJuICEhKHdpbmRvdy5mcmFtZUVsZW1lbnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gISEoJHNjb3BlLnNoYXJlLmFjY2VzcyAmJiAkc2NvcGUuc2hhcmUuYWNjZXNzID09PSBhY2Nlc3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZihhY2Nlc3MgJiYgYWNjZXNzID09ICdlbWJlZCcpe1xuICAgICAgICByZXR1cm4gISEod2luZG93LmZyYW1lRWxlbWVudCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUubG9hZFNoYXJlRmlsZSA9IGZ1bmN0aW9uKCl7XG4gICAgQnJld1NlcnZpY2UuY2xlYXIoKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MgPSBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnNoYXJlZCA9IHRydWU7XG4gICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmxvYWRTaGFyZUZpbGUoJHNjb3BlLnNoYXJlLmZpbGUsICRzY29wZS5zaGFyZS5wYXNzd29yZCB8fCBudWxsKVxuICAgICAgLnRoZW4oZnVuY3Rpb24oY29udGVudHMpIHtcbiAgICAgICAgaWYoY29udGVudHMpe1xuICAgICAgICAgIGlmKGNvbnRlbnRzLm5lZWRQYXNzd29yZCl7XG4gICAgICAgICAgICAkc2NvcGUuc2hhcmUubmVlZFBhc3N3b3JkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLnNldHRpbmdzLnJlY2lwZSl7XG4gICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUgPSBjb250ZW50cy5zZXR0aW5ncy5yZWNpcGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5zaGFyZS5uZWVkUGFzc3dvcmQgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLnNoYXJlICYmIGNvbnRlbnRzLnNoYXJlLmFjY2Vzcyl7XG4gICAgICAgICAgICAgICRzY29wZS5zaGFyZS5hY2Nlc3MgPSBjb250ZW50cy5zaGFyZS5hY2Nlc3M7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihjb250ZW50cy5zZXR0aW5ncyl7XG4gICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncyA9IGNvbnRlbnRzLnNldHRpbmdzO1xuICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucyA9IHtvbjpmYWxzZSx0aW1lcnM6dHJ1ZSxoaWdoOnRydWUsbG93OnRydWUsdGFyZ2V0OnRydWUsc2xhY2s6JycsbGFzdDonJ307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihjb250ZW50cy5rZXR0bGVzKXtcbiAgICAgICAgICAgICAgXy5lYWNoKGNvbnRlbnRzLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgICAgICAgICAga2V0dGxlLmtub2IgPSBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIwMCs1LHN1YlRleHQ6e2VuYWJsZWQ6IHRydWUsdGV4dDogJ3N0YXJ0aW5nLi4uJyxjb2xvcjogJ2dyYXknLGZvbnQ6ICdhdXRvJ319KTtcbiAgICAgICAgICAgICAgICBrZXR0bGUudmFsdWVzID0gW107XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlcyA9IGNvbnRlbnRzLmtldHRsZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2Nlc3NUZW1wcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoXCJPcHBzLCB0aGVyZSB3YXMgYSBwcm9ibGVtIGxvYWRpbmcgdGhlIHNoYXJlZCBzZXNzaW9uLlwiKTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5pbXBvcnRSZWNpcGUgPSBmdW5jdGlvbigkZmlsZUNvbnRlbnQsJGV4dCl7XG5cbiAgICAgIC8vIHBhcnNlIHRoZSBpbXBvcnRlZCBjb250ZW50XG4gICAgICB2YXIgZm9ybWF0dGVkX2NvbnRlbnQgPSBCcmV3U2VydmljZS5mb3JtYXRYTUwoJGZpbGVDb250ZW50KTtcbiAgICAgIHZhciBqc29uT2JqLCByZWNpcGUgPSBudWxsO1xuXG4gICAgICBpZighIWZvcm1hdHRlZF9jb250ZW50KXtcbiAgICAgICAgdmFyIHgyanMgPSBuZXcgWDJKUygpO1xuICAgICAgICBqc29uT2JqID0geDJqcy54bWxfc3RyMmpzb24oIGZvcm1hdHRlZF9jb250ZW50ICk7XG4gICAgICB9XG5cbiAgICAgIGlmKCFqc29uT2JqKVxuICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG5cbiAgICAgIGlmKCRleHQ9PSdic214Jyl7XG4gICAgICAgIGlmKCEhanNvbk9iai5SZWNpcGVzICYmICEhanNvbk9iai5SZWNpcGVzLkRhdGEuUmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouUmVjaXBlcy5EYXRhLlJlY2lwZTtcbiAgICAgICAgZWxzZSBpZighIWpzb25PYmouU2VsZWN0aW9ucyAmJiAhIWpzb25PYmouU2VsZWN0aW9ucy5EYXRhLlJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBqc29uT2JqLlNlbGVjdGlvbnMuRGF0YS5SZWNpcGU7XG4gICAgICAgIGlmKHJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBCcmV3U2VydmljZS5yZWNpcGVCZWVyU21pdGgocmVjaXBlKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSBpZigkZXh0PT0neG1sJyl7XG4gICAgICAgIGlmKCEhanNvbk9iai5SRUNJUEVTICYmICEhanNvbk9iai5SRUNJUEVTLlJFQ0lQRSlcbiAgICAgICAgICByZWNpcGUgPSBqc29uT2JqLlJFQ0lQRVMuUkVDSVBFO1xuICAgICAgICBpZihyZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0gQnJld1NlcnZpY2UucmVjaXBlQmVlclhNTChyZWNpcGUpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZighcmVjaXBlKVxuICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG5cbiAgICAgIGlmKCEhcmVjaXBlLm9nKVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nID0gcmVjaXBlLm9nO1xuICAgICAgaWYoISFyZWNpcGUuZmcpXG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSByZWNpcGUuZmc7XG5cbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUubmFtZSA9IHJlY2lwZS5uYW1lO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5jYXRlZ29yeSA9IHJlY2lwZS5jYXRlZ29yeTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gcmVjaXBlLmFidjtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaWJ1ID0gcmVjaXBlLmlidTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZGF0ZSA9IHJlY2lwZS5kYXRlO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5icmV3ZXIgPSByZWNpcGUuYnJld2VyO1xuXG4gICAgICBpZihyZWNpcGUuZ3JhaW5zLmxlbmd0aCl7XG4gICAgICAgIC8vIHJlY2lwZSBkaXNwbGF5XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zID0gW107XG4gICAgICAgIF8uZWFjaChyZWNpcGUuZ3JhaW5zLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucy5sZW5ndGggJiZcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLCB7bmFtZTogZ3JhaW4ubGFiZWx9KS5sZW5ndGgpe1xuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMsIHtuYW1lOiBncmFpbi5sYWJlbH0pWzBdLmFtb3VudCArPSBwYXJzZUZsb2F0KGdyYWluLmFtb3VudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiBncmFpbi5sYWJlbCwgYW1vdW50OiBwYXJzZUZsb2F0KGdyYWluLmFtb3VudClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHRpbWVyc1xuICAgICAgICB2YXIga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J2dyYWluJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpIHtcbiAgICAgICAgICBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5ncmFpbnMsZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgICAgbGFiZWw6IGdyYWluLmxhYmVsLFxuICAgICAgICAgICAgICAgIG1pbjogZ3JhaW4ubWluLFxuICAgICAgICAgICAgICAgIG5vdGVzOiBncmFpbi5ub3Rlc1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZihyZWNpcGUuaG9wcy5sZW5ndGgpe1xuICAgICAgICAvLyByZWNpcGUgZGlzcGxheVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5ob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLmxlbmd0aCAmJlxuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLCB7bmFtZTogaG9wLmxhYmVsfSkubGVuZ3RoKXtcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcywge25hbWU6IGhvcC5sYWJlbH0pWzBdLmFtb3VudCArPSBwYXJzZUZsb2F0KGhvcC5hbW91bnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IGhvcC5sYWJlbCwgYW1vdW50OiBwYXJzZUZsb2F0KGhvcC5hbW91bnQpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyB0aW1lcnNcbiAgICAgICAgdmFyIGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOidob3AnfSlbMF07XG4gICAgICAgIGlmKGtldHRsZSkge1xuICAgICAgICAgIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLmhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAgICAgICRzY29wZS5hZGRUaW1lcihrZXR0bGUse1xuICAgICAgICAgICAgICAgIGxhYmVsOiBob3AubGFiZWwsXG4gICAgICAgICAgICAgICAgbWluOiBob3AubWluLFxuICAgICAgICAgICAgICAgIG5vdGVzOiBob3Aubm90ZXNcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmKHJlY2lwZS5taXNjLmxlbmd0aCl7XG4gICAgICAgIC8vIHRpbWVyc1xuICAgICAgICB2YXIga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J3dhdGVyJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLm1pc2MsZnVuY3Rpb24obWlzYyl7XG4gICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgbGFiZWw6IG1pc2MubGFiZWwsXG4gICAgICAgICAgICAgIG1pbjogbWlzYy5taW4sXG4gICAgICAgICAgICAgIG5vdGVzOiBtaXNjLm5vdGVzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYocmVjaXBlLnllYXN0Lmxlbmd0aCl7XG4gICAgICAgIC8vIHJlY2lwZSBkaXNwbGF5XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUueWVhc3QgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS55ZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IHllYXN0Lm5hbWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5sb2FkU3R5bGVzID0gZnVuY3Rpb24oKXtcbiAgICBpZighJHNjb3BlLnN0eWxlcyl7XG4gICAgICBCcmV3U2VydmljZS5zdHlsZXMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgJHNjb3BlLnN0eWxlcyA9IHJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5sb2FkQ29uZmlnID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgY29uZmlnID0gW107XG4gICAgaWYoISRzY29wZS5wa2cpe1xuICAgICAgY29uZmlnLnB1c2goQnJld1NlcnZpY2UucGtnKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgJHNjb3BlLnBrZyA9IHJlc3BvbnNlO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmdyYWlucyl7XG4gICAgICBjb25maWcucHVzaChCcmV3U2VydmljZS5ncmFpbnMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmdyYWlucyA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCduYW1lJyksJ25hbWUnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5ob3BzKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5ob3BzKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5ob3BzID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ25hbWUnKSwnbmFtZScpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLndhdGVyKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS53YXRlcigpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUud2F0ZXIgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnc2FsdCcpLCdzYWx0Jyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUubG92aWJvbmQpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLmxvdmlib25kKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5sb3ZpYm9uZCA9IHJlc3BvbnNlO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gJHEuYWxsKGNvbmZpZyk7XG59O1xuXG4gIC8vIGNoZWNrIGlmIHB1bXAgb3IgaGVhdGVyIGFyZSBydW5uaW5nXG4gICRzY29wZS5pbml0ID0gKCkgPT4ge1xuICAgICRzY29wZS5zaG93U2V0dGluZ3MgPSAhJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuc2hhcmVkO1xuICAgIGlmKCRzY29wZS5zaGFyZS5maWxlKVxuICAgICAgcmV0dXJuICRzY29wZS5sb2FkU2hhcmVGaWxlKCk7XG5cbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIC8vdXBkYXRlIG1heFxuICAgICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcFsndGFyZ2V0J10ra2V0dGxlLnRlbXBbJ2RpZmYnXSsxMDtcbiAgICAgICAgLy8gY2hlY2sgdGltZXJzIGZvciBydW5uaW5nXG4gICAgICAgIGlmKCEha2V0dGxlLnRpbWVycyAmJiBrZXR0bGUudGltZXJzLmxlbmd0aCl7XG4gICAgICAgICAgXy5lYWNoKGtldHRsZS50aW1lcnMsIHRpbWVyID0+IHtcbiAgICAgICAgICAgIGlmKHRpbWVyLnJ1bm5pbmcpe1xuICAgICAgICAgICAgICB0aW1lci5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYoIXRpbWVyLnJ1bm5pbmcgJiYgdGltZXIucXVldWUpe1xuICAgICAgICAgICAgICAkdGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIsa2V0dGxlKTtcbiAgICAgICAgICAgICAgfSw2MDAwMCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYodGltZXIudXAgJiYgdGltZXIudXAucnVubmluZyl7XG4gICAgICAgICAgICAgIHRpbWVyLnVwLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIudXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5zZXRFcnJvck1lc3NhZ2UgPSBmdW5jdGlvbihlcnIsIGtldHRsZSwgbG9jYXRpb24pe1xuICAgIGlmKCEhJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuc2hhcmVkKXtcbiAgICAgICRzY29wZS5lcnJvci50eXBlID0gJ3dhcm5pbmcnO1xuICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCdUaGUgbW9uaXRvciBzZWVtcyB0byBiZSBvZmYtbGluZSwgcmUtY29ubmVjdGluZy4uLicpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbWVzc2FnZTtcblxuICAgICAgaWYodHlwZW9mIGVyciA9PSAnc3RyaW5nJyAmJiBlcnIuaW5kZXhPZigneycpICE9PSAtMSl7XG4gICAgICAgIGlmKCFPYmplY3Qua2V5cyhlcnIpLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgICBlcnIgPSBKU09OLnBhcnNlKGVycik7XG4gICAgICAgIGlmKCFPYmplY3Qua2V5cyhlcnIpLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZih0eXBlb2YgZXJyID09ICdzdHJpbmcnKVxuICAgICAgICBtZXNzYWdlID0gZXJyO1xuICAgICAgZWxzZSBpZighIWVyci5zdGF0dXNUZXh0KVxuICAgICAgICBtZXNzYWdlID0gZXJyLnN0YXR1c1RleHQ7XG4gICAgICBlbHNlIGlmKGVyci5jb25maWcgJiYgZXJyLmNvbmZpZy51cmwpXG4gICAgICAgIG1lc3NhZ2UgPSBlcnIuY29uZmlnLnVybDtcbiAgICAgIGVsc2UgaWYoZXJyLnZlcnNpb24pe1xuICAgICAgICBpZihrZXR0bGUpXG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UudmVyc2lvbiA9IGVyci52ZXJzaW9uO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVzc2FnZSA9IEpTT04uc3RyaW5naWZ5KGVycik7XG4gICAgICAgIGlmKG1lc3NhZ2UgPT0gJ3t9JykgbWVzc2FnZSA9ICcnO1xuICAgICAgfVxuXG4gICAgICBpZighIW1lc3NhZ2Upe1xuICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLnR5cGUgPSAnZGFuZ2VyJztcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS5jb3VudD0wO1xuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKGBDb25uZWN0aW9uIGVycm9yOiAke21lc3NhZ2V9YCk7XG4gICAgICAgICAgaWYobG9jYXRpb24pXG4gICAgICAgICAgICBrZXR0bGUubWVzc2FnZS5sb2NhdGlvbiA9IGxvY2F0aW9uO1xuICAgICAgICAgICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzKHtrZXR0bGU6a2V0dGxlfSwgbWVzc2FnZSk7XG4gICAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKGBFcnJvcjogJHttZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYoa2V0dGxlKXtcbiAgICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQ9MDtcbiAgICAgICAga2V0dGxlLm1lc3NhZ2UubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoYEVycm9yIGNvbm5lY3RpbmcgdG8gJHtCcmV3U2VydmljZS5kb21haW4oa2V0dGxlLmFyZHVpbm8pfWApO1xuICAgICAgICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyh7a2V0dGxlOmtldHRsZX0sIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCdDb25uZWN0aW9uIGVycm9yOicpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMgPSBmdW5jdGlvbihyZXNwb25zZSwgZXJyb3Ipe1xuICAgIHZhciBhcmR1aW5vID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLCB7aWQ6IHJlc3BvbnNlLmtldHRsZS5hcmR1aW5vLmlkfSk7XG4gICAgaWYoYXJkdWluby5sZW5ndGgpe1xuICAgICAgYXJkdWlub1swXS5zdGF0dXMuZHQgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYocmVzcG9uc2Uuc2tldGNoX3ZlcnNpb24pXG4gICAgICAgIGFyZHVpbm9bMF0udmVyc2lvbiA9IHJlc3BvbnNlLnNrZXRjaF92ZXJzaW9uO1xuICAgICAgaWYoZXJyb3IpXG4gICAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmVycm9yID0gZXJyb3I7XG4gICAgICBlbHNlXG4gICAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnJlc2V0RXJyb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIGlmKGtldHRsZSkge1xuICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQ9MDtcbiAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCcnKTtcbiAgICAgICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzKHtrZXR0bGU6a2V0dGxlfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICRzY29wZS5lcnJvci50eXBlID0gJ2Rhbmdlcic7XG4gICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJycpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudXBkYXRlVGVtcCA9IGZ1bmN0aW9uKHJlc3BvbnNlLCBrZXR0bGUpe1xuICAgIGlmKCFyZXNwb25zZSl7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcbiAgICAvLyBuZWVkZWQgZm9yIGNoYXJ0c1xuICAgIGtldHRsZS5rZXkgPSBrZXR0bGUubmFtZTtcbiAgICB2YXIgdGVtcHMgPSBbXTtcbiAgICAvL2NoYXJ0IGRhdGVcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgLy91cGRhdGUgZGF0YXR5cGVcbiAgICByZXNwb25zZS50ZW1wID0gcGFyc2VGbG9hdChyZXNwb25zZS50ZW1wKTtcbiAgICByZXNwb25zZS5yYXcgPSBwYXJzZUZsb2F0KHJlc3BvbnNlLnJhdyk7XG4gICAgaWYocmVzcG9uc2Uudm9sdHMpXG4gICAgICByZXNwb25zZS52b2x0cyA9IHBhcnNlRmxvYXQocmVzcG9uc2Uudm9sdHMpO1xuXG4gICAgaWYoISFrZXR0bGUudGVtcC5jdXJyZW50KVxuICAgICAga2V0dGxlLnRlbXAucHJldmlvdXMgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgIC8vIHRlbXAgcmVzcG9uc2UgaXMgaW4gQ1xuICAgIGtldHRsZS50ZW1wLm1lYXN1cmVkID0gKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQgPT0gJ0YnKSA/XG4gICAgICAkZmlsdGVyKCd0b0ZhaHJlbmhlaXQnKShyZXNwb25zZS50ZW1wKSA6XG4gICAgICAkZmlsdGVyKCdyb3VuZCcpKHJlc3BvbnNlLnRlbXAsMik7XG4gICAgLy8gYWRkIGFkanVzdG1lbnRcbiAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gKHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAubWVhc3VyZWQpICsgcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpKTtcbiAgICAvLyBzZXQgcmF3XG4gICAga2V0dGxlLnRlbXAucmF3ID0gcmVzcG9uc2UucmF3O1xuICAgIGtldHRsZS50ZW1wLnZvbHRzID0gcmVzcG9uc2Uudm9sdHM7XG5cbiAgICAvLyB2b2x0IGNoZWNrXG4gICAgaWYoa2V0dGxlLnRlbXAudm9sdHMpe1xuICAgICAgaWYoa2V0dGxlLnRlbXAudHlwZSA9PSAnVGhlcm1pc3RvcicgJiZcbiAgICAgICAga2V0dGxlLnRlbXAucGluLmluZGV4T2YoJ0EnKSA9PT0gMCAmJlxuICAgICAgICAhQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pICYmXG4gICAgICAgIGtldHRsZS50ZW1wLnZvbHRzIDwgMil7XG4gICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZSgnU2Vuc29yIGlzIG5vdCBjb25uZWN0ZWQnLCBrZXR0bGUpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYoa2V0dGxlLnRlbXAudHlwZSAhPSAnQk1QMTgwJyAmJiBcbiAgICAgICFrZXR0bGUudGVtcC52b2x0cyAmJlxuICAgICAgIWtldHRsZS50ZW1wLnJhdyl7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoJ1NlbnNvciBpcyBub3QgY29ubmVjdGVkJywga2V0dGxlKTtcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYoa2V0dGxlLnRlbXAudHlwZSA9PSAnRFMxOEIyMCcgJiYgcmVzcG9uc2UudGVtcCA9PSAtMTI3KXtcbiAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoJ1NlbnNvciBpcyBub3QgY29ubmVjdGVkJywga2V0dGxlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyByZXNldCBhbGwga2V0dGxlcyBldmVyeSByZXNldENoYXJ0XG4gICAgaWYoa2V0dGxlLnZhbHVlcy5sZW5ndGggPiByZXNldENoYXJ0KXtcbiAgICAgICRzY29wZS5rZXR0bGVzLm1hcCgoaykgPT4ge1xuICAgICAgICByZXR1cm4gay52YWx1ZXMuc2hpZnQoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vREhUIHNlbnNvcnMgaGF2ZSBodW1pZGl0eSBhcyBhIHBlcmNlbnRcbiAgICAvL1NvaWxNb2lzdHVyZUQgaGFzIG1vaXN0dXJlIGFzIGEgcGVyY2VudFxuICAgIGlmKCB0eXBlb2YgcmVzcG9uc2UucGVyY2VudCAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBrZXR0bGUucGVyY2VudCA9IHJlc3BvbnNlLnBlcmNlbnQ7XG4gICAgfVxuICAgIC8vIEJNUCBzZW5zb3JzIGhhdmUgYWx0aXR1ZGUgYW5kIHByZXNzdXJlXG4gICAgaWYoIHR5cGVvZiByZXNwb25zZS5hbHRpdHVkZSAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBrZXR0bGUuYWx0aXR1ZGUgPSByZXNwb25zZS5hbHRpdHVkZTtcbiAgICB9XG4gICAgaWYoIHR5cGVvZiByZXNwb25zZS5wcmVzc3VyZSAhPSAndW5kZWZpbmVkJyl7XG4gICAgICAvLyBwYXNjYWwgdG8gaW5jaGVzIG9mIG1lcmN1cnlcbiAgICAgIGtldHRsZS5wcmVzc3VyZSA9IHJlc3BvbnNlLnByZXNzdXJlIC8gMzM4Ni4zODk7XG4gICAgfVxuXG4gICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMoe2tldHRsZTprZXR0bGUsIHNrZXRjaF92ZXJzaW9uOnJlc3BvbnNlLnNrZXRjaF92ZXJzaW9ufSk7XG5cbiAgICB2YXIgY3VycmVudFZhbHVlID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICB2YXIgdW5pdFR5cGUgPSAnXFx1MDBCMCc7XG4gICAgLy9wZXJjZW50P1xuICAgIGlmKCEhQnJld1NlcnZpY2Uuc2Vuc29yVHlwZXMoa2V0dGxlLnRlbXAudHlwZSkucGVyY2VudCAmJiB0eXBlb2Yga2V0dGxlLnBlcmNlbnQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgY3VycmVudFZhbHVlID0ga2V0dGxlLnBlcmNlbnQ7XG4gICAgICB1bml0VHlwZSA9ICdcXHUwMDI1JztcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnZhbHVlcy5wdXNoKFtkYXRlLmdldFRpbWUoKSxjdXJyZW50VmFsdWVdKTtcbiAgICB9XG5cbiAgICAvL2lzIHRlbXAgdG9vIGhpZ2g/XG4gICAgaWYoY3VycmVudFZhbHVlID4ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYpe1xuICAgICAgLy9zdG9wIHRoZSBoZWF0aW5nIGVsZW1lbnRcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0YXJ0IHRoZSBjaGlsbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiAha2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCB0cnVlKS50aGVuKGNvb2xlciA9PiB7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Nvb2xpbmcnO1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH0gLy9pcyB0ZW1wIHRvbyBsb3c/XG4gICAgZWxzZSBpZihjdXJyZW50VmFsdWUgPCBrZXR0bGUudGVtcC50YXJnZXQta2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICAkc2NvcGUubm90aWZ5KGtldHRsZSk7XG4gICAgICAvL3N0YXJ0IHRoZSBoZWF0aW5nIGVsZW1lbnRcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiAha2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCB0cnVlKS50aGVuKGhlYXRpbmcgPT4ge1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdoZWF0aW5nJztcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjAwLDQ3LDQ3LDEpJztcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgICAgLy9zdGFydCB0aGUgcHVtcFxuICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAuYXV0byAmJiAha2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIHRydWUpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgY29vbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHdpdGhpbiB0YXJnZXQhXG4gICAgICBrZXR0bGUudGVtcC5oaXQ9bmV3IERhdGUoKTsvL3NldCB0aGUgdGltZSB0aGUgdGFyZ2V0IHdhcyBoaXQgc28gd2UgY2FuIG5vdyBzdGFydCBhbGVydHNcbiAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlKTtcbiAgICAgIC8vc3RvcCB0aGUgaGVhdGVyXG4gICAgICBpZihrZXR0bGUuaGVhdGVyLmF1dG8gJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5hdXRvICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuICRxLmFsbCh0ZW1wcyk7XG4gIH07XG5cbiAgJHNjb3BlLmdldE5hdk9mZnNldCA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIDEyNSthbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdmJhcicpKVswXS5vZmZzZXRIZWlnaHQ7XG4gIH07XG5cbiAgJHNjb3BlLmFkZFRpbWVyID0gZnVuY3Rpb24oa2V0dGxlLG9wdGlvbnMpe1xuICAgIGlmKCFrZXR0bGUudGltZXJzKVxuICAgICAga2V0dGxlLnRpbWVycz1bXTtcbiAgICBpZihvcHRpb25zKXtcbiAgICAgIG9wdGlvbnMubWluID0gb3B0aW9ucy5taW4gPyBvcHRpb25zLm1pbiA6IDA7XG4gICAgICBvcHRpb25zLnNlYyA9IG9wdGlvbnMuc2VjID8gb3B0aW9ucy5zZWMgOiAwO1xuICAgICAgb3B0aW9ucy5ydW5uaW5nID0gb3B0aW9ucy5ydW5uaW5nID8gb3B0aW9ucy5ydW5uaW5nIDogZmFsc2U7XG4gICAgICBvcHRpb25zLnF1ZXVlID0gb3B0aW9ucy5xdWV1ZSA/IG9wdGlvbnMucXVldWUgOiBmYWxzZTtcbiAgICAgIGtldHRsZS50aW1lcnMucHVzaChvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnRpbWVycy5wdXNoKHtsYWJlbDonRWRpdCBsYWJlbCcsbWluOjYwLHNlYzowLHJ1bm5pbmc6ZmFsc2UscXVldWU6ZmFsc2V9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnJlbW92ZVRpbWVycyA9IGZ1bmN0aW9uKGUsa2V0dGxlKXtcbiAgICB2YXIgYnRuID0gYW5ndWxhci5lbGVtZW50KGUudGFyZ2V0KTtcbiAgICBpZihidG4uaGFzQ2xhc3MoJ2ZhLXRyYXNoJykpIGJ0biA9IGJ0bi5wYXJlbnQoKTtcblxuICAgIGlmKCFidG4uaGFzQ2xhc3MoJ2J0bi1kYW5nZXInKSl7XG4gICAgICBidG4ucmVtb3ZlQ2xhc3MoJ2J0bi1saWdodCcpLmFkZENsYXNzKCdidG4tZGFuZ2VyJyk7XG4gICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICBidG4ucmVtb3ZlQ2xhc3MoJ2J0bi1kYW5nZXInKS5hZGRDbGFzcygnYnRuLWxpZ2h0Jyk7XG4gICAgICB9LDIwMDApO1xuICAgIH0gZWxzZSB7XG4gICAgICBidG4ucmVtb3ZlQ2xhc3MoJ2J0bi1kYW5nZXInKS5hZGRDbGFzcygnYnRuLWxpZ2h0Jyk7XG4gICAgICBrZXR0bGUudGltZXJzPVtdO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudG9nZ2xlUFdNID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIGtldHRsZS5wd20gPSAha2V0dGxlLnB3bTtcbiAgICAgIGlmKGtldHRsZS5wd20pXG4gICAgICAgIGtldHRsZS5zc3IgPSB0cnVlO1xuICB9O1xuXG4gICRzY29wZS50b2dnbGVLZXR0bGUgPSBmdW5jdGlvbihpdGVtLCBrZXR0bGUpe1xuXG4gICAgdmFyIGs7XG5cbiAgICBzd2l0Y2ggKGl0ZW0pIHtcbiAgICAgIGNhc2UgJ2hlYXQnOlxuICAgICAgICBrID0ga2V0dGxlLmhlYXRlcjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdjb29sJzpcbiAgICAgICAgayA9IGtldHRsZS5jb29sZXI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAncHVtcCc6XG4gICAgICAgIGsgPSBrZXR0bGUucHVtcDtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYoIWspXG4gICAgICByZXR1cm47XG5cbiAgICBrLnJ1bm5pbmcgPSAhay5ydW5uaW5nO1xuXG4gICAgaWYoa2V0dGxlLmFjdGl2ZSAmJiBrLnJ1bm5pbmcpe1xuICAgICAgLy9zdGFydCB0aGUgcmVsYXlcbiAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGssIHRydWUpO1xuICAgIH0gZWxzZSBpZighay5ydW5uaW5nKXtcbiAgICAgIC8vc3RvcCB0aGUgcmVsYXlcbiAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGssIGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmhhc1NrZXRjaGVzID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICB2YXIgaGFzQVNrZXRjaCA9IGZhbHNlO1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgIGlmKChrZXR0bGUuaGVhdGVyICYmIGtldHRsZS5oZWF0ZXIuc2tldGNoKSB8fFxuICAgICAgICAoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnNrZXRjaCkgfHxcbiAgICAgICAga2V0dGxlLm5vdGlmeS5zdHJlYW1zIHx8XG4gICAgICAgIGtldHRsZS5ub3RpZnkuc2xhY2sgfHxcbiAgICAgICAga2V0dGxlLm5vdGlmeS5kd2VldFxuICAgICAgKSB7XG4gICAgICAgIGhhc0FTa2V0Y2ggPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBoYXNBU2tldGNoO1xuICB9O1xuXG4gICRzY29wZS5zdGFydFN0b3BLZXR0bGUgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAga2V0dGxlLmFjdGl2ZSA9ICFrZXR0bGUuYWN0aXZlO1xuICAgICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcbiAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAgIGlmKGtldHRsZS5hY3RpdmUpe1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnc3RhcnRpbmcuLi4nO1xuXG4gICAgICAgIEJyZXdTZXJ2aWNlLnRlbXAoa2V0dGxlKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+ICRzY29wZS51cGRhdGVUZW1wKHJlc3BvbnNlLCBrZXR0bGUpKVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgLy8gdWRwYXRlIGNoYXJ0IHdpdGggY3VycmVudFxuICAgICAgICAgICAga2V0dGxlLnZhbHVlcy5wdXNoKFtkYXRlLmdldFRpbWUoKSxrZXR0bGUudGVtcC5jdXJyZW50XSk7XG4gICAgICAgICAgICBrZXR0bGUubWVzc2FnZS5jb3VudCsrO1xuICAgICAgICAgICAgaWYoa2V0dGxlLm1lc3NhZ2UuY291bnQ9PTcpXG4gICAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgIC8vIHN0YXJ0IHRoZSByZWxheXNcbiAgICAgICAgaWYoa2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIHRydWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgIC8vc3RvcCB0aGUgaGVhdGVyXG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlICYmIGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIC8vc3RvcCB0aGUgcHVtcFxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSAmJiBrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIC8vc3RvcCB0aGUgY29vbGVyXG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlICYmIGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUpe1xuICAgICAgICAgIGlmKGtldHRsZS5wdW1wKSBrZXR0bGUucHVtcC5hdXRvPWZhbHNlO1xuICAgICAgICAgIGlmKGtldHRsZS5oZWF0ZXIpIGtldHRsZS5oZWF0ZXIuYXV0bz1mYWxzZTtcbiAgICAgICAgICBpZihrZXR0bGUuY29vbGVyKSBrZXR0bGUuY29vbGVyLmF1dG89ZmFsc2U7XG4gICAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgfTtcblxuICAkc2NvcGUudG9nZ2xlUmVsYXkgPSBmdW5jdGlvbihrZXR0bGUsIGVsZW1lbnQsIG9uKXtcbiAgICBpZihvbikge1xuICAgICAgaWYoZWxlbWVudC5waW4uaW5kZXhPZignVFAtJyk9PT0wKXtcbiAgICAgICAgdmFyIGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBlbGVtZW50LnBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnRwbGluaygpLm9uKGRldmljZSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYoZWxlbWVudC5wd20pe1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuYW5hbG9nKGtldHRsZSwgZWxlbWVudC5waW4sTWF0aC5yb3VuZCgyNTUqZWxlbWVudC5kdXR5Q3ljbGUvMTAwKSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSBpZihlbGVtZW50LnNzcil7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbiwyNTUpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuZGlnaXRhbChrZXR0bGUsIGVsZW1lbnQucGluLDEpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmKGVsZW1lbnQucGluLmluZGV4T2YoJ1RQLScpPT09MCl7XG4gICAgICAgIHZhciBkZXZpY2UgPSBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLHtkZXZpY2VJZDogZWxlbWVudC5waW4uc3Vic3RyKDMpfSlbMF07XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS50cGxpbmsoKS5vZmYoZGV2aWNlKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPWZhbHNlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYoZWxlbWVudC5wd20gfHwgZWxlbWVudC5zc3Ipe1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuYW5hbG9nKGtldHRsZSwgZWxlbWVudC5waW4sMClcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuZGlnaXRhbChrZXR0bGUsIGVsZW1lbnQucGluLDApXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPWZhbHNlO1xuICAgICAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gICRzY29wZS5pbXBvcnRTZXR0aW5ncyA9IGZ1bmN0aW9uKCRmaWxlQ29udGVudCwkZXh0KXtcbiAgICB0cnkge1xuICAgICAgdmFyIHByb2ZpbGVDb250ZW50ID0gSlNPTi5wYXJzZSgkZmlsZUNvbnRlbnQpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzID0gcHJvZmlsZUNvbnRlbnQuc2V0dGluZ3MgfHwgQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAgICRzY29wZS5rZXR0bGVzID0gcHJvZmlsZUNvbnRlbnQua2V0dGxlcyB8fCBCcmV3U2VydmljZS5kZWZhdWx0S2V0dGxlcygpO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAvLyBlcnJvciBpbXBvcnRpbmdcbiAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5leHBvcnRTZXR0aW5ncyA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGtldHRsZXMgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLmtldHRsZXMpO1xuICAgIF8uZWFjaChrZXR0bGVzLCAoa2V0dGxlLCBpKSA9PiB7XG4gICAgICBrZXR0bGVzW2ldLnZhbHVlcyA9IFtdO1xuICAgICAga2V0dGxlc1tpXS5hY3RpdmUgPSBmYWxzZTtcbiAgICB9KTtcbiAgICByZXR1cm4gXCJkYXRhOnRleHQvanNvbjtjaGFyc2V0PXV0Zi04LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KHtcInNldHRpbmdzXCI6ICRzY29wZS5zZXR0aW5ncyxcImtldHRsZXNcIjoga2V0dGxlc30pKTtcbiAgfTtcblxuICAkc2NvcGUuY29tcGlsZVNrZXRjaCA9IGZ1bmN0aW9uKHNrZXRjaE5hbWUpe1xuICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycylcbiAgICAgICRzY29wZS5zZXR0aW5ncy5zZW5zb3JzID0ge307XG4gICAgLy8gYXBwZW5kIGVzcCB0eXBlXG4gICAgaWYoc2tldGNoTmFtZS5pbmRleE9mKCdFU1AnKSAhPT0gLTEpXG4gICAgICBza2V0Y2hOYW1lICs9ICRzY29wZS5lc3AudHlwZTtcbiAgICB2YXIgc2tldGNoZXMgPSBbXTtcbiAgICB2YXIgYXJkdWlub05hbWUgPSAnJztcbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIGFyZHVpbm9OYW1lID0ga2V0dGxlLmFyZHVpbm8udXJsLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpO1xuICAgICAgdmFyIGN1cnJlbnRTa2V0Y2ggPSBfLmZpbmQoc2tldGNoZXMse25hbWU6YXJkdWlub05hbWV9KTtcbiAgICAgIGlmKCFjdXJyZW50U2tldGNoKXtcbiAgICAgICAgc2tldGNoZXMucHVzaCh7XG4gICAgICAgICAgbmFtZTogYXJkdWlub05hbWUsXG4gICAgICAgICAgYWN0aW9uczogW10sXG4gICAgICAgICAgaGVhZGVyczogW10sXG4gICAgICAgICAgdHJpZ2dlcnM6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgICAgICBjdXJyZW50U2tldGNoID0gXy5maW5kKHNrZXRjaGVzLHtuYW1lOmFyZHVpbm9OYW1lfSk7XG4gICAgICB9XG4gICAgICB2YXIgdGFyZ2V0ID0gKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQ9PSdGJykgPyAkZmlsdGVyKCd0b0NlbHNpdXMnKShrZXR0bGUudGVtcC50YXJnZXQpIDoga2V0dGxlLnRlbXAudGFyZ2V0O1xuICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpO1xuICAgICAgdmFyIGFkanVzdCA9ICgkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0PT0nRicgJiYgISFrZXR0bGUudGVtcC5hZGp1c3QpID8gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMC41NTUsMykgOiBrZXR0bGUudGVtcC5hZGp1c3Q7XG4gICAgICBpZihCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubykgJiYgJHNjb3BlLmVzcC5hdXRvY29ubmVjdCl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8QXV0b0Nvbm5lY3QuaD4nKTtcbiAgICAgIH1cbiAgICAgIGlmKChza2V0Y2hOYW1lLmluZGV4T2YoJ0VTUCcpICE9PSAtMSB8fCBCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubykpICYmXG4gICAgICAgICgkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5ESFQgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdESFQnKSAhPT0gLTEpICYmXG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSBcIkRIVGVzcC5oXCInKSA9PT0gLTEpe1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcvLyBodHRwczovL2dpdGh1Yi5jb20vYmVlZ2VlLXRva3lvL0RIVGVzcCcpO1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSBcIkRIVGVzcC5oXCInKTtcbiAgICAgIH0gZWxzZSBpZighQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pICYmXG4gICAgICAgICgkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5ESFQgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdESFQnKSAhPT0gLTEpICYmXG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8ZGh0Lmg+JykgPT09IC0xKXtcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly93d3cuYnJld2JlbmNoLmNvL2xpYnMvREhUbGliLTEuMi45LnppcCcpO1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8ZGh0Lmg+Jyk7XG4gICAgICB9XG4gICAgICBpZigkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5EUzE4QjIwIHx8IGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignRFMxOEIyMCcpICE9PSAtMSl7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8T25lV2lyZS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPE9uZVdpcmUuaD4nKTtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxEYWxsYXNUZW1wZXJhdHVyZS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPERhbGxhc1RlbXBlcmF0dXJlLmg+Jyk7XG4gICAgICB9XG4gICAgICBpZigkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5CTVAgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdCTVAxODAnKSAhPT0gLTEpe1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPFdpcmUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxXaXJlLmg+Jyk7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQk1QMDg1Lmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQk1QMDg1Lmg+Jyk7XG4gICAgICB9XG4gICAgICAvLyBBcmUgd2UgdXNpbmcgQURDP1xuICAgICAgaWYoa2V0dGxlLnRlbXAucGluLmluZGV4T2YoJ0MnKSA9PT0gMCAmJiBjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0FEUzEwMTUuaD4nKSA9PT0gLTEpe1xuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly9naXRodWIuY29tL2FkYWZydWl0L0FkYWZydWl0X0FEUzFYMTUnKTtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxPbmVXaXJlLmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8V2lyZS5oPicpO1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0FEUzEwMTUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxBZGFmcnVpdF9BRFMxMDE1Lmg+Jyk7XG4gICAgICB9XG4gICAgICB2YXIga2V0dGxlVHlwZSA9IGtldHRsZS50ZW1wLnR5cGU7XG4gICAgICBpZihrZXR0bGUudGVtcC52Y2MpIGtldHRsZVR5cGUgKz0ga2V0dGxlLnRlbXAudmNjO1xuICAgICAgaWYoa2V0dGxlLnRlbXAuaW5kZXgpIGtldHRsZVR5cGUgKz0gJy0nK2tldHRsZS50ZW1wLmluZGV4O1xuICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJ2FjdGlvbnNDb21tYW5kKEYoXCInK2tldHRsZS5uYW1lLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIiksRihcIicra2V0dGxlLnRlbXAucGluKydcIiksRihcIicra2V0dGxlVHlwZSsnXCIpLCcrYWRqdXN0KycpOycpO1xuICAgICAgLy9sb29rIGZvciB0cmlnZ2Vyc1xuICAgICAgaWYoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLnNrZXRjaCl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2gudHJpZ2dlcnMgPSB0cnVlO1xuICAgICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgndHJpZ2dlcihGKFwiaGVhdFwiKSxGKFwiJytrZXR0bGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIpLEYoXCInK2tldHRsZS5oZWF0ZXIucGluKydcIiksdGVtcCwnK3RhcmdldCsnLCcra2V0dGxlLnRlbXAuZGlmZisnLCcrISFrZXR0bGUubm90aWZ5LnNsYWNrKycpOycpO1xuICAgICAgfVxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnNrZXRjaCl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2gudHJpZ2dlcnMgPSB0cnVlO1xuICAgICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgndHJpZ2dlcihGKFwiY29vbFwiKSxGKFwiJytrZXR0bGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIpLEYoXCInK2tldHRsZS5jb29sZXIucGluKydcIiksdGVtcCwnK3RhcmdldCsnLCcra2V0dGxlLnRlbXAuZGlmZisnLCcrISFrZXR0bGUubm90aWZ5LnNsYWNrKycpOycpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIF8uZWFjaChza2V0Y2hlcywgKHNrZXRjaCwgaSkgPT4ge1xuICAgICAgaWYoc2tldGNoLnRyaWdnZXJzKXtcbiAgICAgICAgc2tldGNoLmFjdGlvbnMudW5zaGlmdCgnZmxvYXQgdGVtcCA9IDAuMDA7JylcbiAgICAgICAgLy8gdXBkYXRlIGF1dG9Db21tYW5kXG4gICAgICAgIGZvcih2YXIgYSA9IDA7IGEgPCBza2V0Y2guYWN0aW9ucy5sZW5ndGg7IGErKyl7XG4gICAgICAgICAgaWYoc2tldGNoZXNbaV0uYWN0aW9uc1thXS5pbmRleE9mKCdhY3Rpb25zQ29tbWFuZCgnKSAhPT0gLTEpXG4gICAgICAgICAgICBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdID0gc2tldGNoZXNbaV0uYWN0aW9uc1thXS5yZXBsYWNlKCdhY3Rpb25zQ29tbWFuZCgnLCd0ZW1wID0gYWN0aW9uc0NvbW1hbmQoJylcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZG93bmxvYWRTa2V0Y2goc2tldGNoLm5hbWUsIHNrZXRjaC5hY3Rpb25zLCBza2V0Y2gudHJpZ2dlcnMsIHNrZXRjaC5oZWFkZXJzLCAnQnJld0JlbmNoJytza2V0Y2hOYW1lKTtcbiAgICB9KTtcbiAgfTtcblxuICBmdW5jdGlvbiBkb3dubG9hZFNrZXRjaChuYW1lLCBhY3Rpb25zLCBoYXNUcmlnZ2VycywgaGVhZGVycywgc2tldGNoKXtcbiAgICAvLyB0cCBsaW5rIGNvbm5lY3Rpb25cbiAgICB2YXIgdHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nID0gQnJld1NlcnZpY2UudHBsaW5rKCkuY29ubmVjdGlvbigpO1xuICAgIHZhciBhdXRvZ2VuID0gJy8qIFNrZXRjaCBBdXRvIEdlbmVyYXRlZCBmcm9tIGh0dHA6Ly9tb25pdG9yLmJyZXdiZW5jaC5jbyBvbiAnK21vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCBISDpNTTpTUycpKycgZm9yICcrbmFtZSsnICovXFxuJztcbiAgICAkaHR0cC5nZXQoJ2Fzc2V0cy9hcmR1aW5vLycrc2tldGNoKycvJytza2V0Y2grJy5pbm8nKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAvLyByZXBsYWNlIHZhcmlhYmxlc1xuICAgICAgICByZXNwb25zZS5kYXRhID0gYXV0b2dlbityZXNwb25zZS5kYXRhXG4gICAgICAgICAgLnJlcGxhY2UoJy8vIFtBQ1RJT05TXScsIGFjdGlvbnMubGVuZ3RoID8gYWN0aW9ucy5qb2luKCdcXG4nKSA6ICcnKVxuICAgICAgICAgIC5yZXBsYWNlKCcvLyBbSEVBREVSU10nLCBoZWFkZXJzLmxlbmd0aCA/IGhlYWRlcnMuam9pbignXFxuJykgOiAnJylcbiAgICAgICAgICAucmVwbGFjZSgvXFxbVkVSU0lPTlxcXS9nLCAkc2NvcGUucGtnLnNrZXRjaF92ZXJzaW9uKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXFtUUExJTktfQ09OTkVDVElPTlxcXS9nLCB0cGxpbmtfY29ubmVjdGlvbl9zdHJpbmcpXG4gICAgICAgICAgLnJlcGxhY2UoL1xcW1NMQUNLX0NPTk5FQ1RJT05cXF0vZywgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2spO1xuXG4gICAgICAgIGlmKCRzY29wZS5lc3Auc3NpZCl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbU1NJRFxcXS9nLCAkc2NvcGUuZXNwLnNzaWQpO1xuICAgICAgICB9XG4gICAgICAgIGlmKCRzY29wZS5lc3Auc3NpZF9wYXNzKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtTU0lEX1BBU1NcXF0vZywgJHNjb3BlLmVzcC5zc2lkX3Bhc3MpO1xuICAgICAgICB9XG4gICAgICAgIGlmKHNrZXRjaC5pbmRleE9mKCdFU1AnKSAhPT0gLTEgJiYgJHNjb3BlLmVzcC5ob3N0bmFtZSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSE9TVE5BTUVcXF0vZywgJHNjb3BlLmVzcC5ob3N0bmFtZSk7XG4gICAgICAgIH0gZWxzZSBpZihza2V0Y2guaW5kZXhPZignRVNQJykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtIT1NUTkFNRVxcXS9nLCAnYmJlc3AnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtIT1NUTkFNRVxcXS9nLCBuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZiggc2tldGNoLmluZGV4T2YoJ1N0cmVhbXMnKSAhPT0gLTEpe1xuICAgICAgICAgIC8vIHN0cmVhbXMgY29ubmVjdGlvblxuICAgICAgICAgIHZhciBjb25uZWN0aW9uX3N0cmluZyA9IGBodHRwczovLyR7JHNjb3BlLnNldHRpbmdzLnN0cmVhbXMudXNlcm5hbWV9LnN0cmVhbXMuYnJld2JlbmNoLmNvYDtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtTVFJFQU1TX0NPTk5FQ1RJT05cXF0vZywgY29ubmVjdGlvbl9zdHJpbmcpO1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW1NUUkVBTVNfQVVUSFxcXS9nLCAnQXV0aG9yaXphdGlvbjogQmFzaWMgJytidG9hKCRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnVzZXJuYW1lLnRyaW0oKSsnOicrJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuYXBpX2tleS50cmltKCkpKTtcbiAgICAgICAgfSBpZiggc2tldGNoLmluZGV4T2YoJ0luZmx1eERCJykgIT09IC0xKXtcbiAgICAgICAgICAvLyBpbmZsdXggZGIgY29ubmVjdGlvblxuICAgICAgICAgIHZhciBjb25uZWN0aW9uX3N0cmluZyA9IGAkeyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51cmx9YDtcbiAgICAgICAgICBpZigkc2NvcGUuaW5mbHV4ZGIuYnJld2JlbmNoSG9zdGVkKCkpe1xuICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gJy9iYnAnO1xuICAgICAgICAgICAgaWYoc2tldGNoLmluZGV4T2YoJ0VTUCcpICE9PSAtMSl7XG4gICAgICAgICAgICAgIC8vIGRvZXMgbm90IHN1cHBvcnQgaHR0cHNcbiAgICAgICAgICAgICAgaWYoY29ubmVjdGlvbl9zdHJpbmcuaW5kZXhPZignaHR0cHM6JykgPT09IDApXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgPSBjb25uZWN0aW9uX3N0cmluZy5yZXBsYWNlKCdodHRwczonLCdodHRwOicpO1xuICAgICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtJTkZMVVhEQl9BVVRIXFxdL2csIGJ0b2EoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVzZXIudHJpbSgpKyc6Jyskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucGFzcy50cmltKCkpKTtcbiAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbQVBJX0tFWVxcXS9nLCAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucGFzcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtJTkZMVVhEQl9BVVRIXFxdL2csICdBdXRob3JpemF0aW9uOiBCYXNpYyAnK2J0b2EoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVzZXIudHJpbSgpKyc6Jyskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucGFzcy50cmltKCkpKTtcbiAgICAgICAgICAgICAgdmFyIGFkZGl0aW9uYWxfcG9zdF9wYXJhbXMgPSAnICBwLmFkZFBhcmFtZXRlcihGKFwiLUhcIikpO1xcbic7XG4gICAgICAgICAgICAgIGFkZGl0aW9uYWxfcG9zdF9wYXJhbXMgKz0gJyAgcC5hZGRQYXJhbWV0ZXIoRihcIlgtQVBJLUtFWTogJyskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucGFzcysnXCIpKTsnO1xuICAgICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKCcvLyBhZGRpdGlvbmFsX3Bvc3RfcGFyYW1zJywgYWRkaXRpb25hbF9wb3N0X3BhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmKCAhISRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wb3J0IClcbiAgICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gYDokeyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wb3J0fWA7XG4gICAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSAnL3dyaXRlPyc7XG4gICAgICAgICAgICAvLyBhZGQgdXNlci9wYXNzXG4gICAgICAgICAgICBpZighISRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyICYmICEhJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MpXG4gICAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSBgdT0keyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyfSZwPSR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3N9JmBcbiAgICAgICAgICAgIC8vIGFkZCBkYlxuICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gJ2RiPScrKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiB8fCAnc2Vzc2lvbi0nK21vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCcpKTtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0lORkxVWERCX0FVVEhcXF0vZywgJycpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtJTkZMVVhEQl9DT05ORUNUSU9OXFxdL2csIGNvbm5lY3Rpb25fc3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxkaHQuaD4nKSAhPT0gLTEgfHwgaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSBcIkRIVGVzcC5oXCInKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBESFQgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxEYWxsYXNUZW1wZXJhdHVyZS5oPicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIERTMThCMjAgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxBZGFmcnVpdF9BRFMxMDE1Lmg+JykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gQURDIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQk1QMDg1Lmg+JykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gQk1QMTgwIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGFzVHJpZ2dlcnMpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyB0cmlnZ2VycyAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzdHJlYW1Ta2V0Y2ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5zZXRBdHRyaWJ1dGUoJ2Rvd25sb2FkJywgc2tldGNoKyctJytuYW1lKycuaW5vJyk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCBcImRhdGE6dGV4dC9pbm87Y2hhcnNldD11dGYtOCxcIiArIGVuY29kZVVSSUNvbXBvbmVudChyZXNwb25zZS5kYXRhKSk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHN0cmVhbVNrZXRjaCk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5jbGljaygpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHN0cmVhbVNrZXRjaCk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCB0byBkb3dubG9hZCBza2V0Y2ggJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgJHNjb3BlLmdldElQQWRkcmVzcyA9IGZ1bmN0aW9uKCl7XG4gICAgJHNjb3BlLnNldHRpbmdzLmlwQWRkcmVzcyA9IFwiXCI7XG4gICAgQnJld1NlcnZpY2UuaXAoKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaXBBZGRyZXNzID0gcmVzcG9uc2UuaXA7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyKTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5ub3RpZnkgPSBmdW5jdGlvbihrZXR0bGUsdGltZXIpe1xuXG4gICAgLy9kb24ndCBzdGFydCBhbGVydHMgdW50aWwgd2UgaGF2ZSBoaXQgdGhlIHRlbXAudGFyZ2V0XG4gICAgaWYoIXRpbWVyICYmIGtldHRsZSAmJiAha2V0dGxlLnRlbXAuaGl0XG4gICAgICB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5vbiA9PT0gZmFsc2Upe1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAvLyBEZXNrdG9wIC8gU2xhY2sgTm90aWZpY2F0aW9uXG4gICAgdmFyIG1lc3NhZ2UsXG4gICAgICBpY29uID0gJy9hc3NldHMvaW1nL2JyZXdiZW5jaC1sb2dvLnBuZycsXG4gICAgICBjb2xvciA9ICdnb29kJztcblxuICAgIGlmKGtldHRsZSAmJiBbJ2hvcCcsJ2dyYWluJywnd2F0ZXInLCdmZXJtZW50ZXInXS5pbmRleE9mKGtldHRsZS50eXBlKSE9PS0xKVxuICAgICAgaWNvbiA9ICcvYXNzZXRzL2ltZy8nK2tldHRsZS50eXBlKycucG5nJztcblxuICAgIC8vZG9uJ3QgYWxlcnQgaWYgdGhlIGhlYXRlciBpcyBydW5uaW5nIGFuZCB0ZW1wIGlzIHRvbyBsb3dcbiAgICBpZihrZXR0bGUgJiYga2V0dGxlLmxvdyAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpXG4gICAgICByZXR1cm47XG5cbiAgICB2YXIgY3VycmVudFZhbHVlID0gKGtldHRsZSAmJiBrZXR0bGUudGVtcCkgPyBrZXR0bGUudGVtcC5jdXJyZW50IDogMDtcbiAgICB2YXIgdW5pdFR5cGUgPSAnXFx1MDBCMCc7XG4gICAgLy9wZXJjZW50P1xuICAgIGlmKGtldHRsZSAmJiAhIUJyZXdTZXJ2aWNlLnNlbnNvclR5cGVzKGtldHRsZS50ZW1wLnR5cGUpLnBlcmNlbnQgJiYgdHlwZW9mIGtldHRsZS5wZXJjZW50ICE9ICd1bmRlZmluZWQnKXtcbiAgICAgIGN1cnJlbnRWYWx1ZSA9IGtldHRsZS5wZXJjZW50O1xuICAgICAgdW5pdFR5cGUgPSAnXFx1MDAyNSc7XG4gICAgfSBlbHNlIGlmKGtldHRsZSl7XG4gICAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGN1cnJlbnRWYWx1ZV0pO1xuICAgIH1cblxuICAgIGlmKCEhdGltZXIpeyAvL2tldHRsZSBpcyBhIHRpbWVyIG9iamVjdFxuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnRpbWVycylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYodGltZXIudXApXG4gICAgICAgIG1lc3NhZ2UgPSAnWW91ciB0aW1lcnMgYXJlIGRvbmUnO1xuICAgICAgZWxzZSBpZighIXRpbWVyLm5vdGVzKVxuICAgICAgICBtZXNzYWdlID0gJ1RpbWUgdG8gYWRkICcrdGltZXIubm90ZXMrJyBvZiAnK3RpbWVyLmxhYmVsO1xuICAgICAgZWxzZVxuICAgICAgICBtZXNzYWdlID0gJ1RpbWUgdG8gYWRkICcrdGltZXIubGFiZWw7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlICYmIGtldHRsZS5oaWdoKXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5oaWdoIHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSdoaWdoJylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgJyskZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5oaWdoLWtldHRsZS50ZW1wLmRpZmYsMCkrdW5pdFR5cGUrJyBoaWdoJztcbiAgICAgIGNvbG9yID0gJ2Rhbmdlcic7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSdoaWdoJztcbiAgICB9XG4gICAgZWxzZSBpZihrZXR0bGUgJiYga2V0dGxlLmxvdyl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubG93IHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSdsb3cnKVxuICAgICAgICByZXR1cm47XG4gICAgICBtZXNzYWdlID0ga2V0dGxlLm5hbWUrJyBpcyAnKyRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLmxvdy1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgbG93JztcbiAgICAgIGNvbG9yID0gJyMzNDk4REInO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0nbG93JztcbiAgICB9XG4gICAgZWxzZSBpZihrZXR0bGUpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnRhcmdldCB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0ndGFyZ2V0JylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgd2l0aGluIHRoZSB0YXJnZXQgYXQgJytjdXJyZW50VmFsdWUrdW5pdFR5cGU7XG4gICAgICBjb2xvciA9ICdnb29kJztcbiAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9J3RhcmdldCc7XG4gICAgfVxuICAgIGVsc2UgaWYoIWtldHRsZSl7XG4gICAgICBtZXNzYWdlID0gJ1Rlc3RpbmcgQWxlcnRzLCB5b3UgYXJlIHJlYWR5IHRvIGdvLCBjbGljayBwbGF5IG9uIGEga2V0dGxlLic7XG4gICAgfVxuXG4gICAgLy8gTW9iaWxlIFZpYnJhdGUgTm90aWZpY2F0aW9uXG4gICAgaWYgKFwidmlicmF0ZVwiIGluIG5hdmlnYXRvcikge1xuICAgICAgbmF2aWdhdG9yLnZpYnJhdGUoWzUwMCwgMzAwLCA1MDBdKTtcbiAgICB9XG5cbiAgICAvLyBTb3VuZCBOb3RpZmljYXRpb25cbiAgICBpZigkc2NvcGUuc2V0dGluZ3Muc291bmRzLm9uPT09dHJ1ZSl7XG4gICAgICAvL2Rvbid0IGFsZXJ0IGlmIHRoZSBoZWF0ZXIgaXMgcnVubmluZyBhbmQgdGVtcCBpcyB0b28gbG93XG4gICAgICBpZighIXRpbWVyICYmIGtldHRsZSAmJiBrZXR0bGUubG93ICYmIGtldHRsZS5oZWF0ZXIucnVubmluZylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgdmFyIHNuZCA9IG5ldyBBdWRpbygoISF0aW1lcikgPyAkc2NvcGUuc2V0dGluZ3Muc291bmRzLnRpbWVyIDogJHNjb3BlLnNldHRpbmdzLnNvdW5kcy5hbGVydCk7IC8vIGJ1ZmZlcnMgYXV0b21hdGljYWxseSB3aGVuIGNyZWF0ZWRcbiAgICAgIHNuZC5wbGF5KCk7XG4gICAgfVxuXG4gICAgLy8gV2luZG93IE5vdGlmaWNhdGlvblxuICAgIGlmKFwiTm90aWZpY2F0aW9uXCIgaW4gd2luZG93KXtcbiAgICAgIC8vY2xvc2UgdGhlIG1lYXN1cmVkIG5vdGlmaWNhdGlvblxuICAgICAgaWYobm90aWZpY2F0aW9uKVxuICAgICAgICBub3RpZmljYXRpb24uY2xvc2UoKTtcblxuICAgICAgaWYoTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gPT09IFwiZ3JhbnRlZFwiKXtcbiAgICAgICAgaWYobWVzc2FnZSl7XG4gICAgICAgICAgaWYoa2V0dGxlKVxuICAgICAgICAgICAgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbihrZXR0bGUubmFtZSsnIGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKCdUZXN0IGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmKE5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uICE9PSAnZGVuaWVkJyl7XG4gICAgICAgIE5vdGlmaWNhdGlvbi5yZXF1ZXN0UGVybWlzc2lvbihmdW5jdGlvbiAocGVybWlzc2lvbikge1xuICAgICAgICAgIC8vIElmIHRoZSB1c2VyIGFjY2VwdHMsIGxldCdzIGNyZWF0ZSBhIG5vdGlmaWNhdGlvblxuICAgICAgICAgIGlmIChwZXJtaXNzaW9uID09PSBcImdyYW50ZWRcIikge1xuICAgICAgICAgICAgaWYobWVzc2FnZSl7XG4gICAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oa2V0dGxlLm5hbWUrJyBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gU2xhY2sgTm90aWZpY2F0aW9uXG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2suaW5kZXhPZignaHR0cCcpID09PSAwKXtcbiAgICAgIEJyZXdTZXJ2aWNlLnNsYWNrKCRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrLFxuICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgY29sb3IsXG4gICAgICAgICAgaWNvbixcbiAgICAgICAgICBrZXR0bGVcbiAgICAgICAgKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgICBpZihlcnIubWVzc2FnZSlcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCBwb3N0aW5nIHRvIFNsYWNrICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHBvc3RpbmcgdG8gU2xhY2sgJHtKU09OLnN0cmluZ2lmeShlcnIpfWApO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5ID0gZnVuY3Rpb24oa2V0dGxlKXtcblxuICAgIGlmKCFrZXR0bGUuYWN0aXZlKXtcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAnI2RkZCc7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICcjNzc3JztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdub3QgcnVubmluZyc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZihrZXR0bGUubWVzc2FnZS5tZXNzYWdlICYmIGtldHRsZS5tZXNzYWdlLnR5cGUgPT0gJ2Rhbmdlcicpe1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICcjZGRkJztcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJyM3NzcnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Vycm9yJztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBjdXJyZW50VmFsdWUgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgIHZhciB1bml0VHlwZSA9ICdcXHUwMEIwJztcbiAgICAvL3BlcmNlbnQ/XG4gICAgaWYoISFCcmV3U2VydmljZS5zZW5zb3JUeXBlcyhrZXR0bGUudGVtcC50eXBlKS5wZXJjZW50ICYmIHR5cGVvZiBrZXR0bGUucGVyY2VudCAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBjdXJyZW50VmFsdWUgPSBrZXR0bGUucGVyY2VudDtcbiAgICAgIHVuaXRUeXBlID0gJ1xcdTAwMjUnO1xuICAgIH1cbiAgICAvL2lzIGN1cnJlbnRWYWx1ZSB0b28gaGlnaD9cbiAgICBpZihjdXJyZW50VmFsdWUgPiBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjYpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSgyNTUsMCwwLC4xKSc7XG4gICAgICBrZXR0bGUuaGlnaCA9IGN1cnJlbnRWYWx1ZS1rZXR0bGUudGVtcC50YXJnZXQ7XG4gICAgICBrZXR0bGUubG93ID0gbnVsbDtcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Nvb2xpbmcnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwxKSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL3VwZGF0ZSBrbm9iIHRleHRcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUuaGlnaC1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgaGlnaCc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmKGN1cnJlbnRWYWx1ZSA8IGtldHRsZS50ZW1wLnRhcmdldC1rZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwuNSknO1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksLjEpJztcbiAgICAgIGtldHRsZS5sb3cgPSBrZXR0bGUudGVtcC50YXJnZXQtY3VycmVudFZhbHVlO1xuICAgICAga2V0dGxlLmhpZ2ggPSBudWxsO1xuICAgICAgaWYoa2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2hlYXRpbmcnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy91cGRhdGUga25vYiB0ZXh0XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLmxvdy1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgbG93JztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDQ0LDE5MywxMzMsLjYpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSg0NCwxOTMsMTMzLC4xKSc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnd2l0aGluIHRhcmdldCc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAga2V0dGxlLmxvdyA9IG51bGw7XG4gICAgICBrZXR0bGUuaGlnaCA9IG51bGw7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VLZXR0bGVUeXBlID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAvL2Rvbid0IGFsbG93IGNoYW5naW5nIGtldHRsZXMgb24gc2hhcmVkIHNlc3Npb25zXG4gICAgLy90aGlzIGNvdWxkIGJlIGRhbmdlcm91cyBpZiBkb2luZyB0aGlzIHJlbW90ZWx5XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuc2hhcmVkKVxuICAgICAgcmV0dXJuO1xuICAgIC8vIGZpbmQgY3VycmVudCBrZXR0bGVcbiAgICB2YXIga2V0dGxlSW5kZXggPSBfLmZpbmRJbmRleCgkc2NvcGUua2V0dGxlVHlwZXMsIHt0eXBlOiBrZXR0bGUudHlwZX0pO1xuICAgIC8vIG1vdmUgdG8gbmV4dCBvciBmaXJzdCBrZXR0bGUgaW4gYXJyYXlcbiAgICBrZXR0bGVJbmRleCsrO1xuICAgIHZhciBrZXR0bGVUeXBlID0gKCRzY29wZS5rZXR0bGVUeXBlc1trZXR0bGVJbmRleF0pID8gJHNjb3BlLmtldHRsZVR5cGVzW2tldHRsZUluZGV4XSA6ICRzY29wZS5rZXR0bGVUeXBlc1swXTtcbiAgICAvL3VwZGF0ZSBrZXR0bGUgb3B0aW9ucyBpZiBjaGFuZ2VkXG4gICAga2V0dGxlLm5hbWUgPSBrZXR0bGVUeXBlLm5hbWU7XG4gICAga2V0dGxlLnR5cGUgPSBrZXR0bGVUeXBlLnR5cGU7XG4gICAga2V0dGxlLnRlbXAudGFyZ2V0ID0ga2V0dGxlVHlwZS50YXJnZXQ7XG4gICAga2V0dGxlLnRlbXAuZGlmZiA9IGtldHRsZVR5cGUuZGlmZjtcbiAgICBrZXR0bGUua25vYiA9IGFuZ3VsYXIuY29weShCcmV3U2VydmljZS5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6a2V0dGxlLnRlbXAuY3VycmVudCxtaW46MCxtYXg6a2V0dGxlVHlwZS50YXJnZXQra2V0dGxlVHlwZS5kaWZmfSk7XG4gICAgaWYoa2V0dGxlVHlwZS50eXBlID09ICdmZXJtZW50ZXInIHx8IGtldHRsZVR5cGUudHlwZSA9PSAnYWlyJyl7XG4gICAgICBrZXR0bGUuY29vbGVyID0ge3BpbjonRDInLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9O1xuICAgICAgZGVsZXRlIGtldHRsZS5wdW1wO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUucHVtcCA9IHtwaW46J0QyJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfTtcbiAgICAgIGRlbGV0ZSBrZXR0bGUuY29vbGVyO1xuICAgIH1cbiAgICAkc2NvcGUudXBkYXRlU3RyZWFtcyhrZXR0bGUpO1xuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VVbml0cyA9IGZ1bmN0aW9uKHVuaXQpe1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQgIT0gdW5pdCl7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0ID0gdW5pdDtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcyxmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgICBrZXR0bGUudGVtcC50YXJnZXQgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLnRhcmdldCk7XG4gICAgICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmN1cnJlbnQpO1xuICAgICAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLmN1cnJlbnQsdW5pdCk7XG4gICAgICAgIGtldHRsZS50ZW1wLm1lYXN1cmVkID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLm1lYXN1cmVkLHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC5wcmV2aW91cyA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC5wcmV2aW91cyx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAudGFyZ2V0ID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLnRhcmdldCx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAudGFyZ2V0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC50YXJnZXQsMCk7XG4gICAgICAgIGlmKCEha2V0dGxlLnRlbXAuYWRqdXN0KXtcbiAgICAgICAgICBrZXR0bGUudGVtcC5hZGp1c3QgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCk7XG4gICAgICAgICAgaWYodW5pdCA9PT0gJ0MnKVxuICAgICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMC41NTUsMyk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMS44LDApO1xuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSBjaGFydCB2YWx1ZXNcbiAgICAgICAgaWYoa2V0dGxlLnZhbHVlcy5sZW5ndGgpe1xuICAgICAgICAgICAgXy5lYWNoKGtldHRsZS52YWx1ZXMsICh2LCBpKSA9PiB7XG4gICAgICAgICAgICAgIGtldHRsZS52YWx1ZXNbaV0gPSBba2V0dGxlLnZhbHVlc1tpXVswXSwkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnZhbHVlc1tpXVsxXSx1bml0KV07XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gdXBkYXRlIGtub2JcbiAgICAgICAga2V0dGxlLmtub2IudmFsdWUgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZisxMDtcbiAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICB9KTtcbiAgICAgICRzY29wZS5jaGFydE9wdGlvbnMgPSBCcmV3U2VydmljZS5jaGFydE9wdGlvbnMoe3VuaXQ6ICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQsIGNoYXJ0OiAkc2NvcGUuc2V0dGluZ3MuY2hhcnQsIHNlc3Npb246ICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnNlc3Npb259KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRpbWVyUnVuID0gZnVuY3Rpb24odGltZXIsa2V0dGxlKXtcbiAgICByZXR1cm4gJGludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vY2FuY2VsIGludGVydmFsIGlmIHplcm8gb3V0XG4gICAgICBpZighdGltZXIudXAgJiYgdGltZXIubWluPT0wICYmIHRpbWVyLnNlYz09MCl7XG4gICAgICAgIC8vc3RvcCBydW5uaW5nXG4gICAgICAgIHRpbWVyLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgLy9zdGFydCB1cCBjb3VudGVyXG4gICAgICAgIHRpbWVyLnVwID0ge21pbjowLHNlYzowLHJ1bm5pbmc6dHJ1ZX07XG4gICAgICAgIC8vaWYgYWxsIHRpbWVycyBhcmUgZG9uZSBzZW5kIGFuIGFsZXJ0XG4gICAgICAgIGlmKCAhIWtldHRsZSAmJiBfLmZpbHRlcihrZXR0bGUudGltZXJzLCB7dXA6IHtydW5uaW5nOnRydWV9fSkubGVuZ3RoID09IGtldHRsZS50aW1lcnMubGVuZ3RoIClcbiAgICAgICAgICAkc2NvcGUubm90aWZ5KGtldHRsZSx0aW1lcik7XG4gICAgICB9IGVsc2UgaWYoIXRpbWVyLnVwICYmIHRpbWVyLnNlYyA+IDApe1xuICAgICAgICAvL2NvdW50IGRvd24gc2Vjb25kc1xuICAgICAgICB0aW1lci5zZWMtLTtcbiAgICAgIH0gZWxzZSBpZih0aW1lci51cCAmJiB0aW1lci51cC5zZWMgPCA1OSl7XG4gICAgICAgIC8vY291bnQgdXAgc2Vjb25kc1xuICAgICAgICB0aW1lci51cC5zZWMrKztcbiAgICAgIH0gZWxzZSBpZighdGltZXIudXApe1xuICAgICAgICAvL3Nob3VsZCB3ZSBzdGFydCB0aGUgbmV4dCB0aW1lcj9cbiAgICAgICAgaWYoISFrZXR0bGUpe1xuICAgICAgICAgIF8uZWFjaChfLmZpbHRlcihrZXR0bGUudGltZXJzLCB7cnVubmluZzpmYWxzZSxtaW46dGltZXIubWluLHF1ZXVlOmZhbHNlfSksZnVuY3Rpb24obmV4dFRpbWVyKXtcbiAgICAgICAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlLG5leHRUaW1lcik7XG4gICAgICAgICAgICBuZXh0VGltZXIucXVldWU9dHJ1ZTtcbiAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KG5leHRUaW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgfSw2MDAwMCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9jb3VuZCBkb3duIG1pbnV0ZXMgYW5kIHNlY29uZHNcbiAgICAgICAgdGltZXIuc2VjPTU5O1xuICAgICAgICB0aW1lci5taW4tLTtcbiAgICAgIH0gZWxzZSBpZih0aW1lci51cCl7XG4gICAgICAgIC8vY291bmQgdXAgbWludXRlcyBhbmQgc2Vjb25kc1xuICAgICAgICB0aW1lci51cC5zZWM9MDtcbiAgICAgICAgdGltZXIudXAubWluKys7XG4gICAgICB9XG4gICAgfSwxMDAwKTtcbiAgfTtcblxuICAkc2NvcGUudGltZXJTdGFydCA9IGZ1bmN0aW9uKHRpbWVyLGtldHRsZSl7XG4gICAgaWYodGltZXIudXAgJiYgdGltZXIudXAucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGltZXJcbiAgICAgIHRpbWVyLnVwLnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyLmludGVydmFsKTtcbiAgICB9IGVsc2UgaWYodGltZXIucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGltZXJcbiAgICAgIHRpbWVyLnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyLmludGVydmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy9zdGFydCB0aW1lclxuICAgICAgdGltZXIucnVubmluZz10cnVlO1xuICAgICAgdGltZXIucXVldWU9ZmFsc2U7XG4gICAgICB0aW1lci5pbnRlcnZhbCA9ICRzY29wZS50aW1lclJ1bih0aW1lcixrZXR0bGUpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucHJvY2Vzc1RlbXBzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgYWxsU2Vuc29ycyA9IFtdO1xuICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAvL29ubHkgcHJvY2VzcyBhY3RpdmUgc2Vuc29yc1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywgKGssIGkpID0+IHtcbiAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2ldLmFjdGl2ZSl7XG4gICAgICAgIGFsbFNlbnNvcnMucHVzaChCcmV3U2VydmljZS50ZW1wKCRzY29wZS5rZXR0bGVzW2ldKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+ICRzY29wZS51cGRhdGVUZW1wKHJlc3BvbnNlLCAkc2NvcGUua2V0dGxlc1tpXSkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAvLyB1ZHBhdGUgY2hhcnQgd2l0aCBjdXJyZW50XG4gICAgICAgICAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGtldHRsZS50ZW1wLmN1cnJlbnRdKTtcbiAgICAgICAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50KVxuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudCsrO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudD0xO1xuICAgICAgICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQgPT0gNyl7XG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50PTA7XG4gICAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCAkc2NvcGUua2V0dGxlc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiAkcS5hbGwoYWxsU2Vuc29ycylcbiAgICAgIC50aGVuKHZhbHVlcyA9PiB7XG4gICAgICAgIC8vcmUgcHJvY2VzcyBvbiB0aW1lb3V0XG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2Nlc3NUZW1wcygpO1xuICAgICAgICB9LCghISRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcykgPyAkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMqMTAwMCA6IDEwMDAwKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgIH0sKCEhJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKSA/ICRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwIDogMTAwMDApO1xuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5yZW1vdmVLZXR0bGUgPSBmdW5jdGlvbihrZXR0bGUsJGluZGV4KXtcbiAgICAkc2NvcGUudXBkYXRlU3RyZWFtcyhrZXR0bGUpO1xuICAgICRzY29wZS5rZXR0bGVzLnNwbGljZSgkaW5kZXgsMSk7XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZVZhbHVlID0gZnVuY3Rpb24oa2V0dGxlLGZpZWxkLHVwKXtcblxuICAgIGlmKHRpbWVvdXQpXG4gICAgICAkdGltZW91dC5jYW5jZWwodGltZW91dCk7XG5cbiAgICBpZih1cClcbiAgICAgIGtldHRsZS50ZW1wW2ZpZWxkXSsrO1xuICAgIGVsc2VcbiAgICAgIGtldHRsZS50ZW1wW2ZpZWxkXS0tO1xuXG4gICAgaWYoZmllbGQgPT0gJ2FkanVzdCcpe1xuICAgICAga2V0dGxlLnRlbXAuY3VycmVudCA9IChwYXJzZUZsb2F0KGtldHRsZS50ZW1wLm1lYXN1cmVkKSArIHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuYWRqdXN0KSk7XG4gICAgfVxuXG4gICAgLy91cGRhdGUga25vYiBhZnRlciAxIHNlY29uZHMsIG90aGVyd2lzZSB3ZSBnZXQgYSBsb3Qgb2YgcmVmcmVzaCBvbiB0aGUga25vYiB3aGVuIGNsaWNraW5nIHBsdXMgb3IgbWludXNcbiAgICB0aW1lb3V0ID0gJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIC8vdXBkYXRlIG1heFxuICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXBbJ3RhcmdldCddK2tldHRsZS50ZW1wWydkaWZmJ10rMTA7XG4gICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICRzY29wZS51cGRhdGVTdHJlYW1zKGtldHRsZSk7XG4gICAgfSwxMDAwKTtcbiAgfTtcblxuICAkc2NvcGUudXBkYXRlU3RyZWFtcyA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgLy91cGRhdGUgc3RyZWFtc1xuICAgIGlmKCRzY29wZS5zdHJlYW1zLmNvbm5lY3RlZCgpICYmIGtldHRsZS5ub3RpZnkuc3RyZWFtcyl7XG4gICAgICAkc2NvcGUuc3RyZWFtcy5rZXR0bGVzKGtldHRsZSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5sb2FkQ29uZmlnKCkgLy8gbG9hZCBjb25maWdcbiAgICAudGhlbigkc2NvcGUuaW5pdCkgLy8gaW5pdFxuICAgIC50aGVuKGxvYWRlZCA9PiB7XG4gICAgICBpZighIWxvYWRlZClcbiAgICAgICAgJHNjb3BlLnByb2Nlc3NUZW1wcygpOyAvLyBzdGFydCBwb2xsaW5nXG4gICAgfSk7XG5cbiAgLy8gdXBkYXRlIGxvY2FsIGNhY2hlXG4gICRzY29wZS51cGRhdGVMb2NhbCA9IGZ1bmN0aW9uKCl7XG4gICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzZXR0aW5ncycsICRzY29wZS5zZXR0aW5ncyk7XG4gICAgICBCcmV3U2VydmljZS5zZXR0aW5ncygna2V0dGxlcycsJHNjb3BlLmtldHRsZXMpO1xuICAgICAgJHNjb3BlLnVwZGF0ZUxvY2FsKCk7XG4gICAgfSw1MDAwKTtcbiAgfVxuICAkc2NvcGUudXBkYXRlTG9jYWwoKTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2NvbnRyb2xsZXJzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5kaXJlY3RpdmUoJ2VkaXRhYmxlJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHttb2RlbDonPScsdHlwZTonQD8nLHRyaW06J0A/JyxjaGFuZ2U6JyY/JyxlbnRlcjonJj8nLHBsYWNlaG9sZGVyOidAPyd9LFxuICAgICAgICByZXBsYWNlOiBmYWxzZSxcbiAgICAgICAgdGVtcGxhdGU6XG4nPHNwYW4+JytcbiAgICAnPGlucHV0IHR5cGU9XCJ7e3R5cGV9fVwiIG5nLW1vZGVsPVwibW9kZWxcIiBuZy1zaG93PVwiZWRpdFwiIG5nLWVudGVyPVwiZWRpdD1mYWxzZVwiIG5nLWNoYW5nZT1cInt7Y2hhbmdlfHxmYWxzZX19XCIgY2xhc3M9XCJlZGl0YWJsZVwiPjwvaW5wdXQ+JytcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwiZWRpdGFibGVcIiBuZy1zaG93PVwiIWVkaXRcIj57eyh0cmltKSA/ICgodHlwZT09XCJwYXNzd29yZFwiKSA/IFwiKioqKioqKlwiIDogKChtb2RlbCB8fCBwbGFjZWhvbGRlcikgfCBsaW1pdFRvOnRyaW0pK1wiLi4uXCIpIDonK1xuICAgICAgICAnICgodHlwZT09XCJwYXNzd29yZFwiKSA/IFwiKioqKioqKlwiIDogKG1vZGVsIHx8IHBsYWNlaG9sZGVyKSl9fTwvc3Bhbj4nK1xuJzwvc3Bhbj4nLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgIHNjb3BlLmVkaXQgPSBmYWxzZTtcbiAgICAgICAgICAgIHNjb3BlLnR5cGUgPSAhIXNjb3BlLnR5cGUgPyBzY29wZS50eXBlIDogJ3RleHQnO1xuICAgICAgICAgICAgZWxlbWVudC5iaW5kKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLiRhcHBseShzY29wZS5lZGl0ID0gdHJ1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmKHNjb3BlLmVudGVyKSBzY29wZS5lbnRlcigpO1xuICAgICAgICB9XG4gICAgfTtcbn0pXG4uZGlyZWN0aXZlKCduZ0VudGVyJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICBlbGVtZW50LmJpbmQoJ2tleXByZXNzJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgaWYgKGUuY2hhckNvZGUgPT09IDEzIHx8IGUua2V5Q29kZSA9PT0xMyApIHtcbiAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KGF0dHJzLm5nRW50ZXIpO1xuICAgICAgICAgICAgICBpZihzY29wZS5jaGFuZ2UpXG4gICAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KHNjb3BlLmNoYW5nZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG59KVxuLmRpcmVjdGl2ZSgnb25SZWFkRmlsZScsIGZ1bmN0aW9uICgkcGFyc2UpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0EnLFxuXHRcdHNjb3BlOiBmYWxzZSxcblx0XHRsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIHZhciBmbiA9ICRwYXJzZShhdHRycy5vblJlYWRGaWxlKTtcblxuXHRcdFx0ZWxlbWVudC5vbignY2hhbmdlJywgZnVuY3Rpb24ob25DaGFuZ2VFdmVudCkge1xuXHRcdFx0XHR2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgdmFyIGZpbGUgPSAob25DaGFuZ2VFdmVudC5zcmNFbGVtZW50IHx8IG9uQ2hhbmdlRXZlbnQudGFyZ2V0KS5maWxlc1swXTtcbiAgICAgICAgdmFyIGV4dGVuc2lvbiA9IChmaWxlKSA/IGZpbGUubmFtZS5zcGxpdCgnLicpLnBvcCgpLnRvTG93ZXJDYXNlKCkgOiAnJztcblxuXHRcdFx0XHRyZWFkZXIub25sb2FkID0gZnVuY3Rpb24ob25Mb2FkRXZlbnQpIHtcblx0XHRcdFx0XHRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBmbihzY29wZSwgeyRmaWxlQ29udGVudDogb25Mb2FkRXZlbnQudGFyZ2V0LnJlc3VsdCwgJGV4dDogZXh0ZW5zaW9ufSk7XG4gICAgICAgICAgICBlbGVtZW50LnZhbChudWxsKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fTtcblx0XHRcdFx0cmVhZGVyLnJlYWRBc1RleHQoZmlsZSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH07XG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9kaXJlY3RpdmVzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5maWx0ZXIoJ21vbWVudCcsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZnVuY3Rpb24oZGF0ZSwgZm9ybWF0KSB7XG4gICAgICBpZighZGF0ZSlcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgaWYoZm9ybWF0KVxuICAgICAgICByZXR1cm4gbW9tZW50KG5ldyBEYXRlKGRhdGUpKS5mb3JtYXQoZm9ybWF0KTtcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIG1vbWVudChuZXcgRGF0ZShkYXRlKSkuZnJvbU5vdygpO1xuICAgIH07XG59KVxuLmZpbHRlcignZm9ybWF0RGVncmVlcycsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHRlbXAsdW5pdCkge1xuICAgIGlmKHVuaXQ9PSdGJylcbiAgICAgIHJldHVybiAkZmlsdGVyKCd0b0ZhaHJlbmhlaXQnKSh0ZW1wKTtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gJGZpbHRlcigndG9DZWxzaXVzJykodGVtcCk7XG4gIH07XG59KVxuLmZpbHRlcigndG9GYWhyZW5oZWl0JywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24oY2Vsc2l1cykge1xuICAgIGNlbHNpdXMgPSBwYXJzZUZsb2F0KGNlbHNpdXMpO1xuICAgIHJldHVybiAkZmlsdGVyKCdyb3VuZCcpKGNlbHNpdXMqOS81KzMyLDIpO1xuICB9O1xufSlcbi5maWx0ZXIoJ3RvQ2Vsc2l1cycsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGZhaHJlbmhlaXQpIHtcbiAgICBmYWhyZW5oZWl0ID0gcGFyc2VGbG9hdChmYWhyZW5oZWl0KTtcbiAgICByZXR1cm4gJGZpbHRlcigncm91bmQnKSgoZmFocmVuaGVpdC0zMikqNS85LDIpO1xuICB9O1xufSlcbi5maWx0ZXIoJ3JvdW5kJywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24odmFsLGRlY2ltYWxzKSB7XG4gICAgcmV0dXJuIE51bWJlcigoTWF0aC5yb3VuZCh2YWwgKyBcImVcIiArIGRlY2ltYWxzKSAgKyBcImUtXCIgKyBkZWNpbWFscykpO1xuICB9O1xufSlcbi5maWx0ZXIoJ2hpZ2hsaWdodCcsIGZ1bmN0aW9uKCRzY2UpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHRleHQsIHBocmFzZSkge1xuICAgIGlmICh0ZXh0ICYmIHBocmFzZSkge1xuICAgICAgdGV4dCA9IHRleHQucmVwbGFjZShuZXcgUmVnRXhwKCcoJytwaHJhc2UrJyknLCAnZ2knKSwgJzxzcGFuIGNsYXNzPVwiaGlnaGxpZ2h0ZWRcIj4kMTwvc3Bhbj4nKTtcbiAgICB9IGVsc2UgaWYoIXRleHQpe1xuICAgICAgdGV4dCA9ICcnO1xuICAgIH1cbiAgICByZXR1cm4gJHNjZS50cnVzdEFzSHRtbCh0ZXh0LnRvU3RyaW5nKCkpO1xuICB9O1xufSlcbi5maWx0ZXIoJ3RpdGxlY2FzZScsIGZ1bmN0aW9uKCRmaWx0ZXIpe1xuICByZXR1cm4gZnVuY3Rpb24odGV4dCl7XG4gICAgcmV0dXJuICh0ZXh0LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdGV4dC5zbGljZSgxKSk7XG4gIH1cbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2ZpbHRlcnMuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmZhY3RvcnkoJ0JyZXdTZXJ2aWNlJywgZnVuY3Rpb24oJGh0dHAsICRxLCAkZmlsdGVyKXtcblxuICByZXR1cm4ge1xuXG4gICAgLy9jb29raWVzIHNpemUgNDA5NiBieXRlc1xuICAgIGNsZWFyOiBmdW5jdGlvbigpe1xuICAgICAgaWYod2luZG93LmxvY2FsU3RvcmFnZSl7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnc2V0dGluZ3MnKTtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdrZXR0bGVzJyk7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnc2hhcmUnKTtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdhY2Nlc3NUb2tlbicpO1xuICAgICAgfVxuICAgIH0sXG4gICAgYWNjZXNzVG9rZW46IGZ1bmN0aW9uKHRva2VuKXtcbiAgICAgIGlmKHRva2VuKVxuICAgICAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhY2Nlc3NUb2tlbicsdG9rZW4pO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhY2Nlc3NUb2tlbicpO1xuICAgIH0sXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCl7XG4gICAgICBjb25zdCBkZWZhdWx0U2V0dGluZ3MgPSB7XG4gICAgICAgIGdlbmVyYWw6IHtkZWJ1ZzogZmFsc2UsIHBvbGxTZWNvbmRzOiAxMCwgdW5pdDogJ0YnLCBzaGFyZWQ6IGZhbHNlfVxuICAgICAgICAsY2hhcnQ6IHtzaG93OiB0cnVlLCBtaWxpdGFyeTogZmFsc2UsIGFyZWE6IGZhbHNlfVxuICAgICAgICAsc2Vuc29yczoge0RIVDogZmFsc2UsIERTMThCMjA6IGZhbHNlLCBCTVA6IGZhbHNlfVxuICAgICAgICAscmVjaXBlOiB7J25hbWUnOicnLCdicmV3ZXInOntuYW1lOicnLCdlbWFpbCc6Jyd9LCd5ZWFzdCc6W10sJ2hvcHMnOltdLCdncmFpbnMnOltdLHNjYWxlOidncmF2aXR5JyxtZXRob2Q6J3BhcGF6aWFuJywnb2cnOjEuMDUwLCdmZyc6MS4wMTAsJ2Fidic6MCwnYWJ3JzowLCdjYWxvcmllcyc6MCwnYXR0ZW51YXRpb24nOjB9XG4gICAgICAgICxub3RpZmljYXRpb25zOiB7b246dHJ1ZSx0aW1lcnM6dHJ1ZSxoaWdoOnRydWUsbG93OnRydWUsdGFyZ2V0OnRydWUsc2xhY2s6JycsbGFzdDonJ31cbiAgICAgICAgLHNvdW5kczoge29uOnRydWUsYWxlcnQ6Jy9hc3NldHMvYXVkaW8vYmlrZS5tcDMnLHRpbWVyOicvYXNzZXRzL2F1ZGlvL3NjaG9vbC5tcDMnfVxuICAgICAgICAsYXJkdWlub3M6IFt7aWQ6J2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksYm9hcmQ6JycsdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZSx2ZXJzaW9uOicnLHN0YXR1czp7ZXJyb3I6JycsZHQ6JycsbWVzc2FnZTonJ319XVxuICAgICAgICAsdHBsaW5rOiB7dXNlcjogJycsIHBhc3M6ICcnLCB0b2tlbjonJywgc3RhdHVzOiAnJywgcGx1Z3M6IFtdfVxuICAgICAgICAsaW5mbHV4ZGI6IHt1cmw6ICcnLCBwb3J0OiAnJywgdXNlcjogJycsIHBhc3M6ICcnLCBkYjogJycsIGRiczpbXSwgc3RhdHVzOiAnJ31cbiAgICAgICAgLHN0cmVhbXM6IHt1c2VybmFtZTogJycsIGFwaV9rZXk6ICcnLCBzdGF0dXM6ICcnLCBzZXNzaW9uOiB7aWQ6ICcnLCBuYW1lOiAnJywgdHlwZTogJ2Zlcm1lbnRhdGlvbid9fVxuICAgICAgfTtcbiAgICAgIHJldHVybiBkZWZhdWx0U2V0dGluZ3M7XG4gICAgfSxcblxuICAgIGRlZmF1bHRLbm9iT3B0aW9uczogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlYWRPbmx5OiB0cnVlLFxuICAgICAgICB1bml0OiAnXFx1MDBCMCcsXG4gICAgICAgIHN1YlRleHQ6IHtcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgIHRleHQ6ICcnLFxuICAgICAgICAgIGNvbG9yOiAnZ3JheScsXG4gICAgICAgICAgZm9udDogJ2F1dG8nXG4gICAgICAgIH0sXG4gICAgICAgIHRyYWNrV2lkdGg6IDQwLFxuICAgICAgICBiYXJXaWR0aDogMjUsXG4gICAgICAgIGJhckNhcDogMjUsXG4gICAgICAgIHRyYWNrQ29sb3I6ICcjZGRkJyxcbiAgICAgICAgYmFyQ29sb3I6ICcjNzc3JyxcbiAgICAgICAgZHluYW1pY09wdGlvbnM6IHRydWUsXG4gICAgICAgIGRpc3BsYXlQcmV2aW91czogdHJ1ZSxcbiAgICAgICAgcHJldkJhckNvbG9yOiAnIzc3NydcbiAgICAgIH07XG4gICAgfSxcblxuICAgIGRlZmF1bHRLZXR0bGVzOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgbmFtZTogJ0hvdCBMaXF1b3InXG4gICAgICAgICAgLGlkOiBudWxsXG4gICAgICAgICAgLHR5cGU6ICd3YXRlcidcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDInLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0QzJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMCcsdmNjOicnLGluZGV4OicnLHR5cGU6J1RoZXJtaXN0b3InLGFkYzpmYWxzZSxoaXQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MTcwLGRpZmY6MixyYXc6MCx2b2x0czowfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX1cbiAgICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlLCBkd2VldDogZmFsc2UsIHN0cmVhbXM6IGZhbHNlfVxuICAgICAgICB9LHtcbiAgICAgICAgICBuYW1lOiAnTWFzaCdcbiAgICAgICAgICAsaWQ6IG51bGxcbiAgICAgICAgICAsdHlwZTogJ2dyYWluJ1xuICAgICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgICAsaGVhdGVyOiB7cGluOidENCcscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAscHVtcDoge3BpbjonRDUnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHRlbXA6IHtwaW46J0ExJyx2Y2M6JycsaW5kZXg6JycsdHlwZTonVGhlcm1pc3RvcicsYWRjOmZhbHNlLGhpdDpmYWxzZSxjdXJyZW50OjAsbWVhc3VyZWQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDoxNTIsZGlmZjoyLHJhdzowLHZvbHRzOjB9XG4gICAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkodGhpcy5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjIwfSlcbiAgICAgICAgICAsYXJkdWlubzoge2lkOiAnbG9jYWwtJytidG9hKCdicmV3YmVuY2gnKSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzo1LGRpZ2l0YWw6MTMsYWRjOjAsc2VjdXJlOmZhbHNlfVxuICAgICAgICAgICxtZXNzYWdlOiB7dHlwZTonZXJyb3InLG1lc3NhZ2U6JycsdmVyc2lvbjonJyxjb3VudDowLGxvY2F0aW9uOicnfVxuICAgICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2UsIGR3ZWV0OiBmYWxzZSwgc3RyZWFtczogZmFsc2V9XG4gICAgICAgIH0se1xuICAgICAgICAgIG5hbWU6ICdCb2lsJ1xuICAgICAgICAgICxpZDogbnVsbFxuICAgICAgICAgICx0eXBlOiAnaG9wJ1xuICAgICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgICAsaGVhdGVyOiB7cGluOidENicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAscHVtcDoge3BpbjonRDcnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHRlbXA6IHtwaW46J0EyJyx2Y2M6JycsaW5kZXg6JycsdHlwZTonVGhlcm1pc3RvcicsYWRjOmZhbHNlLGhpdDpmYWxzZSxjdXJyZW50OjAsbWVhc3VyZWQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDoyMDAsZGlmZjoyLHJhdzowLHZvbHRzOjB9XG4gICAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkodGhpcy5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjIwfSlcbiAgICAgICAgICAsYXJkdWlubzoge2lkOiAnbG9jYWwtJytidG9hKCdicmV3YmVuY2gnKSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzo1LGRpZ2l0YWw6MTMsYWRjOjAsc2VjdXJlOmZhbHNlfVxuICAgICAgICAgICxtZXNzYWdlOiB7dHlwZTonZXJyb3InLG1lc3NhZ2U6JycsdmVyc2lvbjonJyxjb3VudDowLGxvY2F0aW9uOicnfVxuICAgICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2UsIGR3ZWV0OiBmYWxzZSwgc3RyZWFtczogZmFsc2V9XG4gICAgICAgIH1dO1xuICAgIH0sXG5cbiAgICBzZXR0aW5nczogZnVuY3Rpb24oa2V5LHZhbHVlcyl7XG4gICAgICBpZighd2luZG93LmxvY2FsU3RvcmFnZSlcbiAgICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmKHZhbHVlcyl7XG4gICAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksSlNPTi5zdHJpbmdpZnkodmFsdWVzKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZih3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSl7XG4gICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkpO1xuICAgICAgICB9IGVsc2UgaWYoa2V5ID09ICdzZXR0aW5ncycpe1xuICAgICAgICAgIHJldHVybiB0aGlzLnJlc2V0KCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIC8qSlNPTiBwYXJzZSBlcnJvciovXG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWVzO1xuICAgIH0sXG5cbiAgICBzZW5zb3JUeXBlczogZnVuY3Rpb24obmFtZSl7XG4gICAgICB2YXIgc2Vuc29ycyA9IFtcbiAgICAgICAge25hbWU6ICdUaGVybWlzdG9yJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiBmYWxzZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdEUzE4QjIwJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdQVDEwMCcsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQxMScsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMTInLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IGZhbHNlfVxuICAgICAgICAse25hbWU6ICdESFQyMScsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogZmFsc2V9XG4gICAgICAgICx7bmFtZTogJ0RIVDIyJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQzMycsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogZmFsc2V9XG4gICAgICAgICx7bmFtZTogJ0RIVDQ0JywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiBmYWxzZX1cbiAgICAgICAgLHtuYW1lOiAnU29pbE1vaXN0dXJlJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiBmYWxzZSwgdmNjOiB0cnVlLCBwZXJjZW50OiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0JNUDE4MCcsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogZmFsc2UsIGVzcDogdHJ1ZX1cbiAgICAgIF07XG4gICAgICBpZihuYW1lKVxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoc2Vuc29ycywgeyduYW1lJzogbmFtZX0pWzBdO1xuICAgICAgcmV0dXJuIHNlbnNvcnM7XG4gICAgfSxcblxuICAgIGtldHRsZVR5cGVzOiBmdW5jdGlvbih0eXBlKXtcbiAgICAgIHZhciBrZXR0bGVzID0gW1xuICAgICAgICB7J25hbWUnOidCb2lsJywndHlwZSc6J2hvcCcsJ3RhcmdldCc6MjAwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonTWFzaCcsJ3R5cGUnOidncmFpbicsJ3RhcmdldCc6MTUyLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonSG90IExpcXVvcicsJ3R5cGUnOid3YXRlcicsJ3RhcmdldCc6MTcwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonRmVybWVudGVyJywndHlwZSc6J2Zlcm1lbnRlcicsJ3RhcmdldCc6NzQsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidUZW1wJywndHlwZSc6J2FpcicsJ3RhcmdldCc6NzQsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidTb2lsJywndHlwZSc6J2xlYWYnLCd0YXJnZXQnOjYwLCdkaWZmJzoyfVxuICAgICAgXTtcbiAgICAgIGlmKHR5cGUpXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihrZXR0bGVzLCB7J3R5cGUnOiB0eXBlfSlbMF07XG4gICAgICByZXR1cm4ga2V0dGxlcztcbiAgICB9LFxuXG4gICAgZG9tYWluOiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgZG9tYWluID0gJ2h0dHA6Ly9hcmR1aW5vLmxvY2FsJztcblxuICAgICAgaWYoYXJkdWlubyAmJiBhcmR1aW5vLnVybCl7XG4gICAgICAgIGRvbWFpbiA9IChhcmR1aW5vLnVybC5pbmRleE9mKCcvLycpICE9PSAtMSkgP1xuICAgICAgICAgIGFyZHVpbm8udXJsLnN1YnN0cihhcmR1aW5vLnVybC5pbmRleE9mKCcvLycpKzIpIDpcbiAgICAgICAgICBhcmR1aW5vLnVybDtcblxuICAgICAgICBpZighIWFyZHVpbm8uc2VjdXJlKVxuICAgICAgICAgIGRvbWFpbiA9IGBodHRwczovLyR7ZG9tYWlufWA7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBkb21haW4gPSBgaHR0cDovLyR7ZG9tYWlufWA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkb21haW47XG4gICAgfSxcblxuICAgIGlzRVNQOiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIHJldHVybiAhIShhcmR1aW5vLmJvYXJkICYmIChhcmR1aW5vLmJvYXJkLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignZXNwJykgIT09IC0xIHx8IGFyZHVpbm8uYm9hcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdub2RlbWN1JykgIT09IC0xKSk7XG4gICAgfSxcblxuICAgIHNsYWNrOiBmdW5jdGlvbih3ZWJob29rX3VybCwgbXNnLCBjb2xvciwgaWNvbiwga2V0dGxlKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcblxuICAgICAgdmFyIHBvc3RPYmogPSB7J2F0dGFjaG1lbnRzJzogW3snZmFsbGJhY2snOiBtc2csXG4gICAgICAgICAgICAndGl0bGUnOiBrZXR0bGUubmFtZSxcbiAgICAgICAgICAgICd0aXRsZV9saW5rJzogJ2h0dHA6Ly8nK2RvY3VtZW50LmxvY2F0aW9uLmhvc3QsXG4gICAgICAgICAgICAnZmllbGRzJzogW3sndmFsdWUnOiBtc2d9XSxcbiAgICAgICAgICAgICdjb2xvcic6IGNvbG9yLFxuICAgICAgICAgICAgJ21ya2R3bl9pbic6IFsndGV4dCcsICdmYWxsYmFjaycsICdmaWVsZHMnXSxcbiAgICAgICAgICAgICd0aHVtYl91cmwnOiBpY29uXG4gICAgICAgICAgfV1cbiAgICAgICAgfTtcblxuICAgICAgJGh0dHAoe3VybDogd2ViaG9va191cmwsIG1ldGhvZDonUE9TVCcsIGRhdGE6ICdwYXlsb2FkPScrSlNPTi5zdHJpbmdpZnkocG9zdE9iaiksIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH19KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGNvbm5lY3Q6IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGFyZHVpbm8pKycvYXJkdWluby9pbmZvJztcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpKVxuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuICAgIC8vIFRoZXJtaXN0b3IsIERTMThCMjAsIG9yIFBUMTAwXG4gICAgLy8gaHR0cHM6Ly9sZWFybi5hZGFmcnVpdC5jb20vdGhlcm1pc3Rvci91c2luZy1hLXRoZXJtaXN0b3JcbiAgICAvLyBodHRwczovL3d3dy5hZGFmcnVpdC5jb20vcHJvZHVjdC8zODEpXG4gICAgLy8gaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzI5MCBhbmQgaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzMyOFxuICAgIHRlbXA6IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vLycra2V0dGxlLnRlbXAudHlwZTtcbiAgICAgIGlmKHRoaXMuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pKXtcbiAgICAgICAgaWYoa2V0dGxlLnRlbXAucGluLmluZGV4T2YoJ0EnKSA9PT0gMClcbiAgICAgICAgICB1cmwgKz0gJz9hcGluPScra2V0dGxlLnRlbXAucGluO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgdXJsICs9ICc/ZHBpbj0nK2tldHRsZS50ZW1wLnBpbjtcbiAgICAgICAgaWYoISFrZXR0bGUudGVtcC52Y2MpIC8vU29pbE1vaXN0dXJlIGxvZ2ljXG4gICAgICAgICAgdXJsICs9ICcmZHBpbj0nK2tldHRsZS50ZW1wLnZjYztcbiAgICAgICAgZWxzZSBpZighIWtldHRsZS50ZW1wLmluZGV4KSAvL0RTMThCMjAgbG9naWNcbiAgICAgICAgICB1cmwgKz0gJyZpbmRleD0nK2tldHRsZS50ZW1wLmluZGV4O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYoISFrZXR0bGUudGVtcC52Y2MpIC8vU29pbE1vaXN0dXJlIGxvZ2ljXG4gICAgICAgICAgdXJsICs9IGtldHRsZS50ZW1wLnZjYztcbiAgICAgICAgZWxzZSBpZighIWtldHRsZS50ZW1wLmluZGV4KSAvL0RTMThCMjAgbG9naWNcbiAgICAgICAgICB1cmwgKz0gJyZpbmRleD0nK2tldHRsZS50ZW1wLmluZGV4O1xuICAgICAgICB1cmwgKz0gJy8nK2tldHRsZS50ZW1wLnBpbjtcbiAgICAgIH1cbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG4gICAgLy8gcmVhZC93cml0ZSBoZWF0ZXJcbiAgICAvLyBodHRwOi8vYXJkdWlub3Ryb25pY3MuYmxvZ3Nwb3QuY29tLzIwMTMvMDEvd29ya2luZy13aXRoLXNhaW5zbWFydC01di1yZWxheS1ib2FyZC5odG1sXG4gICAgLy8gaHR0cDovL215aG93dG9zYW5kcHJvamVjdHMuYmxvZ3Nwb3QuY29tLzIwMTQvMDIvc2FpbnNtYXJ0LTItY2hhbm5lbC01di1yZWxheS1hcmR1aW5vLmh0bWxcbiAgICBkaWdpdGFsOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHZhbHVlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vZGlnaXRhbCc7XG4gICAgICBpZih0aGlzLmlzRVNQKGtldHRsZS5hcmR1aW5vKSl7XG4gICAgICAgIHVybCArPSAnP2RwaW49JytzZW5zb3IrJyZ2YWx1ZT0nK3ZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXJsICs9ICcvJytzZW5zb3IrJy8nK3ZhbHVlO1xuICAgICAgfVxuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCB0aW1lb3V0OiBzZXR0aW5ncy5nZW5lcmFsLnBvbGxTZWNvbmRzKjEwMDAwfTtcblxuICAgICAgaWYoa2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpe1xuICAgICAgICByZXF1ZXN0LndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsnQXV0aG9yaXphdGlvbic6ICdCYXNpYyAnK2J0b2EoJ3Jvb3Q6JytrZXR0bGUuYXJkdWluby5wYXNzd29yZC50cmltKCkpfTtcbiAgICAgIH1cblxuICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEuc2tldGNoX3ZlcnNpb24gPSByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyk7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGFuYWxvZzogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix2YWx1ZSl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vL2FuYWxvZyc7XG4gICAgICBpZih0aGlzLmlzRVNQKGtldHRsZS5hcmR1aW5vKSl7XG4gICAgICAgIHVybCArPSAnP2FwaW49JytzZW5zb3IrJyZ2YWx1ZT0nK3ZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXJsICs9ICcvJytzZW5zb3IrJy8nK3ZhbHVlO1xuICAgICAgfVxuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCB0aW1lb3V0OiBzZXR0aW5ncy5nZW5lcmFsLnBvbGxTZWNvbmRzKjEwMDAwfTtcblxuICAgICAgaWYoa2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpe1xuICAgICAgICByZXF1ZXN0LndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsnQXV0aG9yaXphdGlvbic6ICdCYXNpYyAnK2J0b2EoJ3Jvb3Q6JytrZXR0bGUuYXJkdWluby5wYXNzd29yZC50cmltKCkpfTtcbiAgICAgIH1cblxuICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEuc2tldGNoX3ZlcnNpb24gPSByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyk7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGRpZ2l0YWxSZWFkOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHRpbWVvdXQpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby9kaWdpdGFsJztcbiAgICAgIGlmKHRoaXMuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pKXtcbiAgICAgICAgdXJsICs9ICc/ZHBpbj0nK3NlbnNvcjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVybCArPSAnLycrc2Vuc29yO1xuICAgICAgfVxuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCB0aW1lb3V0OiBzZXR0aW5ncy5nZW5lcmFsLnBvbGxTZWNvbmRzKjEwMDAwfTtcblxuICAgICAgaWYoa2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpe1xuICAgICAgICByZXF1ZXN0LndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsnQXV0aG9yaXphdGlvbic6ICdCYXNpYyAnK2J0b2EoJ3Jvb3Q6JytrZXR0bGUuYXJkdWluby5wYXNzd29yZC50cmltKCkpfTtcbiAgICAgIH1cblxuICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEuc2tldGNoX3ZlcnNpb24gPSByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyk7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGxvYWRTaGFyZUZpbGU6IGZ1bmN0aW9uKGZpbGUsIHBhc3N3b3JkKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciBxdWVyeSA9ICcnO1xuICAgICAgaWYocGFzc3dvcmQpXG4gICAgICAgIHF1ZXJ5ID0gJz9wYXNzd29yZD0nK21kNShwYXNzd29yZCk7XG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9nZXQvJytmaWxlK3F1ZXJ5LCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICAvLyBUT0RPIGZpbmlzaCB0aGlzXG4gICAgLy8gZGVsZXRlU2hhcmVGaWxlOiBmdW5jdGlvbihmaWxlLCBwYXNzd29yZCl7XG4gICAgLy8gICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgLy8gICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9kZWxldGUvJytmaWxlLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAvLyAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgIC8vICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAvLyAgICAgfSlcbiAgICAvLyAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgLy8gICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAvLyAgICAgfSk7XG4gICAgLy8gICByZXR1cm4gcS5wcm9taXNlO1xuICAgIC8vIH0sXG5cbiAgICBjcmVhdGVTaGFyZTogZnVuY3Rpb24oc2hhcmUpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciBrZXR0bGVzID0gdGhpcy5zZXR0aW5ncygna2V0dGxlcycpO1xuICAgICAgdmFyIHNoID0gT2JqZWN0LmFzc2lnbih7fSwge3Bhc3N3b3JkOiBzaGFyZS5wYXNzd29yZCwgYWNjZXNzOiBzaGFyZS5hY2Nlc3N9KTtcbiAgICAgIC8vcmVtb3ZlIHNvbWUgdGhpbmdzIHdlIGRvbid0IG5lZWQgdG8gc2hhcmVcbiAgICAgIF8uZWFjaChrZXR0bGVzLCAoa2V0dGxlLCBpKSA9PiB7XG4gICAgICAgIGRlbGV0ZSBrZXR0bGVzW2ldLmtub2I7XG4gICAgICAgIGRlbGV0ZSBrZXR0bGVzW2ldLnZhbHVlcztcbiAgICAgIH0pO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLnN0cmVhbXM7XG4gICAgICBkZWxldGUgc2V0dGluZ3MuaW5mbHV4ZGI7XG4gICAgICBkZWxldGUgc2V0dGluZ3MudHBsaW5rO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLm5vdGlmaWNhdGlvbnM7XG4gICAgICBkZWxldGUgc2V0dGluZ3Muc2tldGNoZXM7XG4gICAgICBzZXR0aW5ncy5zaGFyZWQgPSB0cnVlO1xuICAgICAgaWYoc2gucGFzc3dvcmQpXG4gICAgICAgIHNoLnBhc3N3b3JkID0gbWQ1KHNoLnBhc3N3b3JkKTtcbiAgICAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL2NyZWF0ZS8nLFxuICAgICAgICAgIG1ldGhvZDonUE9TVCcsXG4gICAgICAgICAgZGF0YTogeydzaGFyZSc6IHNoLCAnc2V0dGluZ3MnOiBzZXR0aW5ncywgJ2tldHRsZXMnOiBrZXR0bGVzfSxcbiAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBzaGFyZVRlc3Q6IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHF1ZXJ5ID0gYHVybD0ke2FyZHVpbm8udXJsfWBcblxuICAgICAgaWYoYXJkdWluby5wYXNzd29yZClcbiAgICAgICAgcXVlcnkgKz0gJyZhdXRoPScrYnRvYSgncm9vdDonK2FyZHVpbm8ucGFzc3dvcmQudHJpbSgpKTtcblxuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvdGVzdC8/JytxdWVyeSwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgaXA6IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuXG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9pcCcsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGR3ZWV0OiBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGxhdGVzdDogKCkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vZHdlZXQuaW8vZ2V0L2xhdGVzdC9kd2VldC9mb3IvYnJld2JlbmNoJywgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGFsbDogKCkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vZHdlZXQuaW8vZ2V0L2R3ZWV0cy9mb3IvYnJld2JlbmNoJywgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHRwbGluazogZnVuY3Rpb24oKXtcbiAgICAgIGNvbnN0IHVybCA9IFwiaHR0cHM6Ly93YXAudHBsaW5rY2xvdWQuY29tXCI7XG4gICAgICB2YXIgcGFyYW1zID0ge1xuICAgICAgICBhcHBOYW1lOiAnS2FzYV9BbmRyb2lkJyxcbiAgICAgICAgdGVybUlEOiAnQnJld0JlbmNoJyxcbiAgICAgICAgYXBwVmVyOiAnMS40LjQuNjA3JyxcbiAgICAgICAgb3NwZjogJ0FuZHJvaWQrNi4wLjEnLFxuICAgICAgICBuZXRUeXBlOiAnd2lmaScsXG4gICAgICAgIGxvY2FsZTogJ2VzX0VOJ1xuICAgICAgfTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbm5lY3Rpb246ICgpID0+IHtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIGlmKHNldHRpbmdzLnRwbGluay50b2tlbil7XG4gICAgICAgICAgICBwYXJhbXMudG9rZW4gPSBzZXR0aW5ncy50cGxpbmsudG9rZW47XG4gICAgICAgICAgICByZXR1cm4gdXJsKycvPycralF1ZXJ5LnBhcmFtKHBhcmFtcyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfSxcbiAgICAgICAgbG9naW46ICh1c2VyLHBhc3MpID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgaWYoIXVzZXIgfHwgIXBhc3MpXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgTG9naW4nKTtcbiAgICAgICAgICBjb25zdCBsb2dpbl9wYXlsb2FkID0ge1xuICAgICAgICAgICAgXCJtZXRob2RcIjogXCJsb2dpblwiLFxuICAgICAgICAgICAgXCJ1cmxcIjogdXJsLFxuICAgICAgICAgICAgXCJwYXJhbXNcIjoge1xuICAgICAgICAgICAgICBcImFwcFR5cGVcIjogXCJLYXNhX0FuZHJvaWRcIixcbiAgICAgICAgICAgICAgXCJjbG91ZFBhc3N3b3JkXCI6IHBhc3MsXG4gICAgICAgICAgICAgIFwiY2xvdWRVc2VyTmFtZVwiOiB1c2VyLFxuICAgICAgICAgICAgICBcInRlcm1pbmFsVVVJRFwiOiBwYXJhbXMudGVybUlEXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICAkaHR0cCh7dXJsOiB1cmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkobG9naW5fcGF5bG9hZCksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgLy8gc2F2ZSB0aGUgdG9rZW5cbiAgICAgICAgICAgICAgaWYocmVzcG9uc2UuZGF0YS5yZXN1bHQpe1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIHNjYW46ICh0b2tlbikgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIHRva2VuID0gdG9rZW4gfHwgc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgIGlmKCF0b2tlbilcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCB0b2tlbicpO1xuICAgICAgICAgICRodHRwKHt1cmw6IHVybCxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIHBhcmFtczoge3Rva2VuOiB0b2tlbn0sXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHsgbWV0aG9kOiBcImdldERldmljZUxpc3RcIiB9KSxcbiAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgY29tbWFuZDogKGRldmljZSwgY29tbWFuZCkgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIHZhciB0b2tlbiA9IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICB2YXIgcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIFwibWV0aG9kXCI6XCJwYXNzdGhyb3VnaFwiLFxuICAgICAgICAgICAgXCJwYXJhbXNcIjoge1xuICAgICAgICAgICAgICBcImRldmljZUlkXCI6IGRldmljZS5kZXZpY2VJZCxcbiAgICAgICAgICAgICAgXCJyZXF1ZXN0RGF0YVwiOiBKU09OLnN0cmluZ2lmeSggY29tbWFuZCApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICAvLyBzZXQgdGhlIHRva2VuXG4gICAgICAgICAgaWYoIXRva2VuKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIHRva2VuJyk7XG4gICAgICAgICAgcGFyYW1zLnRva2VuID0gdG9rZW47XG4gICAgICAgICAgJGh0dHAoe3VybDogZGV2aWNlLmFwcFNlcnZlclVybCxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShwYXlsb2FkKSxcbiAgICAgICAgICAgICAgaGVhZGVyczogeydDYWNoZS1Db250cm9sJzogJ25vLWNhY2hlJywgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICB0b2dnbGU6IChkZXZpY2UsIHRvZ2dsZSkgPT4ge1xuICAgICAgICAgIHZhciBjb21tYW5kID0ge1wic3lzdGVtXCI6e1wic2V0X3JlbGF5X3N0YXRlXCI6e1wic3RhdGVcIjogdG9nZ2xlIH19fTtcbiAgICAgICAgICByZXR1cm4gdGhpcy50cGxpbmsoKS5jb21tYW5kKGRldmljZSwgY29tbWFuZCk7XG4gICAgICAgIH0sXG4gICAgICAgIGluZm86IChkZXZpY2UpID0+IHtcbiAgICAgICAgICB2YXIgY29tbWFuZCA9IHtcInN5c3RlbVwiOntcImdldF9zeXNpbmZvXCI6bnVsbH0sXCJlbWV0ZXJcIjp7XCJnZXRfcmVhbHRpbWVcIjpudWxsfX07XG4gICAgICAgICAgcmV0dXJuIHRoaXMudHBsaW5rKCkuY29tbWFuZChkZXZpY2UsIGNvbW1hbmQpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBzdHJlYW1zOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMS9hcGknLCBoZWFkZXJzOiB7fSwgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGF1dGg6IGFzeW5jIChwaW5nKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIGlmKHNldHRpbmdzLnN0cmVhbXMuYXBpX2tleSAmJiBzZXR0aW5ncy5zdHJlYW1zLnVzZXJuYW1lKXtcbiAgICAgICAgICAgIHJlcXVlc3QudXJsICs9IChwaW5nKSA/ICcvdXNlcnMvcGluZycgOiAnL3VzZXJzL2F1dGgnO1xuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnUE9TVCc7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID0nYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ1gtQVBJLUtleSddID0gYCR7c2V0dGluZ3Muc3RyZWFtcy5hcGlfa2V5fWA7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ1gtQkItVXNlciddID0gYCR7c2V0dGluZ3Muc3RyZWFtcy51c2VybmFtZX1gO1xuICAgICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlICYmIHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UuZGF0YS5hY2Nlc3MgJiYgcmVzcG9uc2UuZGF0YS5hY2Nlc3MuaWQpXG4gICAgICAgICAgICAgICAgICB0aGlzLmFjY2Vzc1Rva2VuKHJlc3BvbnNlLmRhdGEuYWNjZXNzLmlkKTtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcS5yZWplY3QoZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBrZXR0bGVzOiB7XG4gICAgICAgICAgZ2V0OiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgdmFyIGF1dGggPSBhd2FpdCB0aGlzLnN0cmVhbXMoKS5hdXRoKCk7XG4gICAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KCdTb3JyeSBCYWQgQXV0aGVudGljYXRpb24nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXF1ZXN0LnVybCArPSAnL2tldHRsZXMnO1xuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnR0VUJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IHRoaXMuYWNjZXNzVG9rZW4oKTtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc2F2ZTogYXN5bmMgKGtldHRsZSkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgIHZhciBhdXRoID0gYXdhaXQgdGhpcy5zdHJlYW1zKCkuYXV0aCgpO1xuICAgICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgICBxLnJlamVjdCgnU29ycnkgQmFkIEF1dGhlbnRpY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHVwZGF0ZWRLZXR0bGUgPSBhbmd1bGFyLmNvcHkoa2V0dGxlKTtcbiAgICAgICAgICAgIC8vIHJlbW92ZSBub3QgbmVlZGVkIGRhdGFcbiAgICAgICAgICAgIGRlbGV0ZSB1cGRhdGVkS2V0dGxlLnZhbHVlcztcbiAgICAgICAgICAgIGRlbGV0ZSB1cGRhdGVkS2V0dGxlLm1lc3NhZ2U7XG4gICAgICAgICAgICBkZWxldGUgdXBkYXRlZEtldHRsZS50aW1lcnM7XG4gICAgICAgICAgICBkZWxldGUgdXBkYXRlZEtldHRsZS5rbm9iO1xuICAgICAgICAgICAgdXBkYXRlZEtldHRsZS50ZW1wLmFkanVzdCA9IChzZXR0aW5ncy5nZW5lcmFsLnVuaXQ9PSdGJyAmJiAhIXVwZGF0ZWRLZXR0bGUudGVtcC5hZGp1c3QpID8gJGZpbHRlcigncm91bmQnKSh1cGRhdGVkS2V0dGxlLnRlbXAuYWRqdXN0KjAuNTU1LDMpIDogdXBkYXRlZEtldHRsZS50ZW1wLmFkanVzdDtcbiAgICAgICAgICAgIHJlcXVlc3QudXJsICs9ICcva2V0dGxlcy9hcm0nO1xuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnUE9TVCc7XG4gICAgICAgICAgICByZXF1ZXN0LmRhdGEgPSB7XG4gICAgICAgICAgICAgIHNlc3Npb246IHNldHRpbmdzLnN0cmVhbXMuc2Vzc2lvbixcbiAgICAgICAgICAgICAga2V0dGxlOiB1cGRhdGVkS2V0dGxlLFxuICAgICAgICAgICAgICBub3RpZmljYXRpb25zOiBzZXR0aW5ncy5ub3RpZmljYXRpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gdGhpcy5hY2Nlc3NUb2tlbigpO1xuICAgICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHNlc3Npb25zOiB7XG4gICAgICAgICAgZ2V0OiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgdmFyIGF1dGggPSBhd2FpdCB0aGlzLnN0cmVhbXMoKS5hdXRoKCk7XG4gICAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KCdTb3JyeSBCYWQgQXV0aGVudGljYXRpb24nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXF1ZXN0LnVybCArPSAnL3Nlc3Npb25zJztcbiAgICAgICAgICAgIHJlcXVlc3QubWV0aG9kID0gJ0dFVCc7XG4gICAgICAgICAgICByZXF1ZXN0LmRhdGEgPSB7XG4gICAgICAgICAgICAgIHNlc3Npb25JZDogc2Vzc2lvbklkLFxuICAgICAgICAgICAgICBrZXR0bGU6IGtldHRsZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IHRoaXMuYWNjZXNzVG9rZW4oKTtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc2F2ZTogYXN5bmMgKHNlc3Npb24pID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICB2YXIgYXV0aCA9IGF3YWl0IHRoaXMuc3RyZWFtcygpLmF1dGgoKTtcbiAgICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoJ1NvcnJ5IEJhZCBBdXRoZW50aWNhdGlvbicpO1xuICAgICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcXVlc3QudXJsICs9ICcvc2Vzc2lvbnMvJytzZXNzaW9uLmlkO1xuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnUEFUQ0gnO1xuICAgICAgICAgICAgcmVxdWVzdC5kYXRhID0ge1xuICAgICAgICAgICAgICBuYW1lOiBzZXNzaW9uLm5hbWUsXG4gICAgICAgICAgICAgIHR5cGU6IHNlc3Npb24udHlwZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IHRoaXMuYWNjZXNzVG9rZW4oKTtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgLy8gZG8gY2FsY3MgdGhhdCBleGlzdCBvbiB0aGUgc2tldGNoXG4gICAgYml0Y2FsYzogZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIHZhciBhdmVyYWdlID0ga2V0dGxlLnRlbXAucmF3O1xuICAgICAgLy8gaHR0cHM6Ly93d3cuYXJkdWluby5jYy9yZWZlcmVuY2UvZW4vbGFuZ3VhZ2UvZnVuY3Rpb25zL21hdGgvbWFwL1xuICAgICAgZnVuY3Rpb24gZm1hcCAoeCxpbl9taW4saW5fbWF4LG91dF9taW4sb3V0X21heCl7XG4gICAgICAgIHJldHVybiAoeCAtIGluX21pbikgKiAob3V0X21heCAtIG91dF9taW4pIC8gKGluX21heCAtIGluX21pbikgKyBvdXRfbWluO1xuICAgICAgfVxuICAgICAgaWYoa2V0dGxlLnRlbXAudHlwZSA9PSAnVGhlcm1pc3Rvcicpe1xuICAgICAgICBjb25zdCBUSEVSTUlTVE9STk9NSU5BTCA9IDEwMDAwO1xuICAgICAgICAvLyB0ZW1wLiBmb3Igbm9taW5hbCByZXNpc3RhbmNlIChhbG1vc3QgYWx3YXlzIDI1IEMpXG4gICAgICAgIGNvbnN0IFRFTVBFUkFUVVJFTk9NSU5BTCA9IDI1O1xuICAgICAgICAvLyBob3cgbWFueSBzYW1wbGVzIHRvIHRha2UgYW5kIGF2ZXJhZ2UsIG1vcmUgdGFrZXMgbG9uZ2VyXG4gICAgICAgIC8vIGJ1dCBpcyBtb3JlICdzbW9vdGgnXG4gICAgICAgIGNvbnN0IE5VTVNBTVBMRVMgPSA1O1xuICAgICAgICAvLyBUaGUgYmV0YSBjb2VmZmljaWVudCBvZiB0aGUgdGhlcm1pc3RvciAodXN1YWxseSAzMDAwLTQwMDApXG4gICAgICAgIGNvbnN0IEJDT0VGRklDSUVOVCA9IDM5NTA7XG4gICAgICAgIC8vIHRoZSB2YWx1ZSBvZiB0aGUgJ290aGVyJyByZXNpc3RvclxuICAgICAgICBjb25zdCBTRVJJRVNSRVNJU1RPUiA9IDEwMDAwO1xuICAgICAgIC8vIGNvbnZlcnQgdGhlIHZhbHVlIHRvIHJlc2lzdGFuY2VcbiAgICAgICAvLyBBcmUgd2UgdXNpbmcgQURDP1xuICAgICAgIGlmKGtldHRsZS50ZW1wLnBpbi5pbmRleE9mKCdDJykgPT09IDApe1xuICAgICAgICAgYXZlcmFnZSA9IChhdmVyYWdlICogKDUuMCAvIDY1NTM1KSkgLyAwLjAwMDE7XG4gICAgICAgICB2YXIgbG4gPSBNYXRoLmxvZyhhdmVyYWdlIC8gVEhFUk1JU1RPUk5PTUlOQUwpO1xuICAgICAgICAgdmFyIGtlbHZpbiA9IDEgLyAoMC4wMDMzNTQwMTcwICsgKDAuMDAwMjU2MTcyNDQgKiBsbikgKyAoMC4wMDAwMDIxNDAwOTQzICogbG4gKiBsbikgKyAoLTAuMDAwMDAwMDcyNDA1MjE5ICogbG4gKiBsbiAqIGxuKSk7XG4gICAgICAgICAgLy8ga2VsdmluIHRvIGNlbHNpdXNcbiAgICAgICAgIHJldHVybiBrZWx2aW4gLSAyNzMuMTU7XG4gICAgICAgfSBlbHNlIHtcbiAgICAgICAgIGF2ZXJhZ2UgPSAxMDIzIC8gYXZlcmFnZSAtIDE7XG4gICAgICAgICBhdmVyYWdlID0gU0VSSUVTUkVTSVNUT1IgLyBhdmVyYWdlO1xuXG4gICAgICAgICB2YXIgc3RlaW5oYXJ0ID0gYXZlcmFnZSAvIFRIRVJNSVNUT1JOT01JTkFMOyAgICAgLy8gKFIvUm8pXG4gICAgICAgICBzdGVpbmhhcnQgPSBNYXRoLmxvZyhzdGVpbmhhcnQpOyAgICAgICAgICAgICAgICAgIC8vIGxuKFIvUm8pXG4gICAgICAgICBzdGVpbmhhcnQgLz0gQkNPRUZGSUNJRU5UOyAgICAgICAgICAgICAgICAgICAvLyAxL0IgKiBsbihSL1JvKVxuICAgICAgICAgc3RlaW5oYXJ0ICs9IDEuMCAvIChURU1QRVJBVFVSRU5PTUlOQUwgKyAyNzMuMTUpOyAvLyArICgxL1RvKVxuICAgICAgICAgc3RlaW5oYXJ0ID0gMS4wIC8gc3RlaW5oYXJ0OyAgICAgICAgICAgICAgICAgLy8gSW52ZXJ0XG4gICAgICAgICBzdGVpbmhhcnQgLT0gMjczLjE1O1xuICAgICAgICAgcmV0dXJuIHN0ZWluaGFydDtcbiAgICAgICB9XG4gICAgIH0gZWxzZSBpZihrZXR0bGUudGVtcC50eXBlID09ICdQVDEwMCcpe1xuICAgICAgIGlmIChrZXR0bGUudGVtcC5yYXcgJiYga2V0dGxlLnRlbXAucmF3PjQwOSl7XG4gICAgICAgIHJldHVybiAoMTUwKmZtYXAoa2V0dGxlLnRlbXAucmF3LDQxMCwxMDIzLDAsNjE0KSkvNjE0O1xuICAgICAgIH1cbiAgICAgfVxuICAgICAgcmV0dXJuICdOL0EnO1xuICAgIH0sXG5cbiAgICBpbmZsdXhkYjogZnVuY3Rpb24oKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgaW5mbHV4Q29ubmVjdGlvbiA9IGAke3NldHRpbmdzLmluZmx1eGRiLnVybH1gO1xuICAgICAgaWYoICEhc2V0dGluZ3MuaW5mbHV4ZGIucG9ydCAmJiBpbmZsdXhDb25uZWN0aW9uLmluZGV4T2YoJ3N0cmVhbXMuYnJld2JlbmNoLmNvJykgPT09IC0xKVxuICAgICAgICBpbmZsdXhDb25uZWN0aW9uICs9IGA6JHtzZXR0aW5ncy5pbmZsdXhkYi5wb3J0fWA7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHBpbmc6IChpbmZsdXhkYikgPT4ge1xuICAgICAgICAgIGlmKGluZmx1eGRiICYmIGluZmx1eGRiLnVybCl7XG4gICAgICAgICAgICBpbmZsdXhDb25uZWN0aW9uID0gYCR7aW5mbHV4ZGIudXJsfWA7XG4gICAgICAgICAgICBpZiggISFpbmZsdXhkYi5wb3J0ICYmIGluZmx1eENvbm5lY3Rpb24uaW5kZXhPZignc3RyZWFtcy5icmV3YmVuY2guY28nKSA9PT0gLTEpXG4gICAgICAgICAgICAgIGluZmx1eENvbm5lY3Rpb24gKz0gYDoke2luZmx1eGRiLnBvcnR9YFxuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IGAke2luZmx1eENvbm5lY3Rpb259YCwgbWV0aG9kOiAnR0VUJ307XG4gICAgICAgICAgaWYoaW5mbHV4Q29ubmVjdGlvbi5pbmRleE9mKCdzdHJlYW1zLmJyZXdiZW5jaC5jbycpICE9PSAtMSl7XG4gICAgICAgICAgICByZXF1ZXN0LnVybCA9IGAke2luZmx1eENvbm5lY3Rpb259L3BpbmdgO1xuICAgICAgICAgICAgaWYoaW5mbHV4ZGIgJiYgaW5mbHV4ZGIudXNlciAmJiBpbmZsdXhkYi5wYXNzKXtcbiAgICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKGluZmx1eGRiLnVzZXIudHJpbSgpKyc6JytpbmZsdXhkYi5wYXNzLnRyaW0oKSl9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKHNldHRpbmdzLmluZmx1eGRiLnVzZXIudHJpbSgpKyc6JytzZXR0aW5ncy5pbmZsdXhkYi5wYXNzLnRyaW0oKSl9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSlcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgZGJzOiAoKSA9PiB7XG4gICAgICAgICAgaWYoaW5mbHV4Q29ubmVjdGlvbi5pbmRleE9mKCdzdHJlYW1zLmJyZXdiZW5jaC5jbycpICE9PSAtMSl7XG4gICAgICAgICAgICBxLnJlc29sdmUoW3NldHRpbmdzLmluZmx1eGRiLnVzZXJdKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRodHRwKHt1cmw6IGAke2luZmx1eENvbm5lY3Rpb259L3F1ZXJ5P3U9JHtzZXR0aW5ncy5pbmZsdXhkYi51c2VyLnRyaW0oKX0mcD0ke3NldHRpbmdzLmluZmx1eGRiLnBhc3MudHJpbSgpfSZxPSR7ZW5jb2RlVVJJQ29tcG9uZW50KCdzaG93IGRhdGFiYXNlcycpfWAsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBpZihyZXNwb25zZS5kYXRhICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzLmxlbmd0aCAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXMgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzLmxlbmd0aCAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXNbMF0udmFsdWVzICl7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXNbMF0udmFsdWVzKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUoW10pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgY3JlYXRlREI6IChuYW1lKSA9PiB7XG4gICAgICAgICAgaWYoaW5mbHV4Q29ubmVjdGlvbi5pbmRleE9mKCdzdHJlYW1zLmJyZXdiZW5jaC5jbycpICE9PSAtMSl7XG4gICAgICAgICAgICBxLnJlamVjdCgnRGF0YWJhc2UgYWxyZWFkeSBleGlzdHMnKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRodHRwKHt1cmw6IGAke2luZmx1eENvbm5lY3Rpb259L3F1ZXJ5P3U9JHtzZXR0aW5ncy5pbmZsdXhkYi51c2VyLnRyaW0oKX0mcD0ke3NldHRpbmdzLmluZmx1eGRiLnBhc3MudHJpbSgpfSZxPSR7ZW5jb2RlVVJJQ29tcG9uZW50KGBDUkVBVEUgREFUQUJBU0UgXCIke25hbWV9XCJgKX1gLCBtZXRob2Q6ICdQT1NUJ30pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgcGtnOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL3BhY2thZ2UuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGdyYWluczogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9ncmFpbnMuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBob3BzOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2hvcHMuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICB3YXRlcjogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS93YXRlci5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIHN0eWxlczogZnVuY3Rpb24oKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL3N0eWxlZ3VpZGUuanNvbicpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgbG92aWJvbmQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvbG92aWJvbmQuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBjaGFydE9wdGlvbnM6IGZ1bmN0aW9uKG9wdGlvbnMpe1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY2hhcnQ6IHtcbiAgICAgICAgICAgICAgdHlwZTogJ2xpbmVDaGFydCcsXG4gICAgICAgICAgICAgIHRpdGxlOiB7XG4gICAgICAgICAgICAgICAgZW5hYmxlOiAhIW9wdGlvbnMuc2Vzc2lvbixcbiAgICAgICAgICAgICAgICB0ZXh0OiAhIW9wdGlvbnMuc2Vzc2lvbiA/IG9wdGlvbnMuc2Vzc2lvbiA6ICcnXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIG5vRGF0YTogJ0JyZXdCZW5jaCBNb25pdG9yJyxcbiAgICAgICAgICAgICAgaGVpZ2h0OiAzNTAsXG4gICAgICAgICAgICAgIG1hcmdpbiA6IHtcbiAgICAgICAgICAgICAgICAgIHRvcDogMjAsXG4gICAgICAgICAgICAgICAgICByaWdodDogMjAsXG4gICAgICAgICAgICAgICAgICBib3R0b206IDEwMCxcbiAgICAgICAgICAgICAgICAgIGxlZnQ6IDY1XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHg6IGZ1bmN0aW9uKGQpeyByZXR1cm4gKGQgJiYgZC5sZW5ndGgpID8gZFswXSA6IGQ7IH0sXG4gICAgICAgICAgICAgIHk6IGZ1bmN0aW9uKGQpeyByZXR1cm4gKGQgJiYgZC5sZW5ndGgpID8gZFsxXSA6IGQ7IH0sXG4gICAgICAgICAgICAgIC8vIGF2ZXJhZ2U6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQubWVhbiB9LFxuXG4gICAgICAgICAgICAgIGNvbG9yOiBkMy5zY2FsZS5jYXRlZ29yeTEwKCkucmFuZ2UoKSxcbiAgICAgICAgICAgICAgZHVyYXRpb246IDMwMCxcbiAgICAgICAgICAgICAgdXNlSW50ZXJhY3RpdmVHdWlkZWxpbmU6IHRydWUsXG4gICAgICAgICAgICAgIGNsaXBWb3Jvbm9pOiBmYWxzZSxcbiAgICAgICAgICAgICAgaW50ZXJwb2xhdGU6ICdiYXNpcycsXG4gICAgICAgICAgICAgIGxlZ2VuZDoge1xuICAgICAgICAgICAgICAgIGtleTogZnVuY3Rpb24gKGQpIHsgcmV0dXJuIGQubmFtZSB9XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGlzQXJlYTogZnVuY3Rpb24gKGQpIHsgcmV0dXJuICEhb3B0aW9ucy5jaGFydC5hcmVhIH0sXG4gICAgICAgICAgICAgIHhBeGlzOiB7XG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWw6ICdUaW1lJyxcbiAgICAgICAgICAgICAgICAgIHRpY2tGb3JtYXQ6IGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZighIW9wdGlvbnMuY2hhcnQubWlsaXRhcnkpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZDMudGltZS5mb3JtYXQoJyVIOiVNOiVTJykobmV3IERhdGUoZCkpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQzLnRpbWUuZm9ybWF0KCclSTolTTolUyVwJykobmV3IERhdGUoZCkpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgb3JpZW50OiAnYm90dG9tJyxcbiAgICAgICAgICAgICAgICAgIHRpY2tQYWRkaW5nOiAyMCxcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbERpc3RhbmNlOiA0MCxcbiAgICAgICAgICAgICAgICAgIHN0YWdnZXJMYWJlbHM6IHRydWVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgZm9yY2VZOiAoIW9wdGlvbnMudW5pdCB8fCBvcHRpb25zLnVuaXQ9PSdGJykgPyBbMCwyMjBdIDogWy0xNywxMDRdLFxuICAgICAgICAgICAgICB5QXhpczoge1xuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsOiAnVGVtcGVyYXR1cmUnLFxuICAgICAgICAgICAgICAgICAgdGlja0Zvcm1hdDogZnVuY3Rpb24oZCl7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRmaWx0ZXIoJ251bWJlcicpKGQsMCkrJ1xcdTAwQjAnO1xuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIG9yaWVudDogJ2xlZnQnLFxuICAgICAgICAgICAgICAgICAgc2hvd01heE1pbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbERpc3RhbmNlOiAwXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcbiAgICAvLyBodHRwOi8vd3d3LmJyZXdlcnNmcmllbmQuY29tLzIwMTEvMDYvMTYvYWxjb2hvbC1ieS12b2x1bWUtY2FsY3VsYXRvci11cGRhdGVkL1xuICAgIC8vIFBhcGF6aWFuXG4gICAgYWJ2OiBmdW5jdGlvbihvZyxmZyl7XG4gICAgICByZXR1cm4gKCggb2cgLSBmZyApICogMTMxLjI1KS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgLy8gRGFuaWVscywgdXNlZCBmb3IgaGlnaCBncmF2aXR5IGJlZXJzXG4gICAgYWJ2YTogZnVuY3Rpb24ob2csZmcpe1xuICAgICAgcmV0dXJuICgoIDc2LjA4ICogKCBvZyAtIGZnICkgLyAoIDEuNzc1IC0gb2cgKSkgKiAoIGZnIC8gMC43OTQgKSkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly9oYmQub3JnL2Vuc21pbmdyL1xuICAgIGFidzogZnVuY3Rpb24oYWJ2LGZnKXtcbiAgICAgIHJldHVybiAoKDAuNzkgKiBhYnYpIC8gZmcpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICByZTogZnVuY3Rpb24ob3AsZnApe1xuICAgICAgcmV0dXJuICgwLjE4MDggKiBvcCkgKyAoMC44MTkyICogZnApO1xuICAgIH0sXG4gICAgYXR0ZW51YXRpb246IGZ1bmN0aW9uKG9wLGZwKXtcbiAgICAgIHJldHVybiAoKDEgLSAoZnAvb3ApKSoxMDApLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICBjYWxvcmllczogZnVuY3Rpb24oYWJ3LHJlLGZnKXtcbiAgICAgIHJldHVybiAoKCg2LjkgKiBhYncpICsgNC4wICogKHJlIC0gMC4xKSkgKiBmZyAqIDMuNTUpLnRvRml4ZWQoMSk7XG4gICAgfSxcbiAgICAvLyBodHRwOi8vd3d3LmJyZXdlcnNmcmllbmQuY29tL3BsYXRvLXRvLXNnLWNvbnZlcnNpb24tY2hhcnQvXG4gICAgc2c6IGZ1bmN0aW9uKHBsYXRvKXtcbiAgICAgIHZhciBzZyA9ICggMSArIChwbGF0byAvICgyNTguNiAtICggKHBsYXRvLzI1OC4yKSAqIDIyNy4xKSApICkgKS50b0ZpeGVkKDMpO1xuICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoc2cpO1xuICAgIH0sXG4gICAgcGxhdG86IGZ1bmN0aW9uKHNnKXtcbiAgICAgIHZhciBwbGF0byA9ICgoLTEgKiA2MTYuODY4KSArICgxMTExLjE0ICogc2cpIC0gKDYzMC4yNzIgKiBNYXRoLnBvdyhzZywyKSkgKyAoMTM1Ljk5NyAqIE1hdGgucG93KHNnLDMpKSkudG9TdHJpbmcoKTtcbiAgICAgIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPT0gNSlcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykrMik7XG4gICAgICBlbHNlIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPCA1KVxuICAgICAgICBwbGF0byA9IHBsYXRvLnN1YnN0cmluZygwLHBsYXRvLmluZGV4T2YoJy4nKSk7XG4gICAgICBlbHNlIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPiA1KXtcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykpO1xuICAgICAgICBwbGF0byA9IHBhcnNlRmxvYXQocGxhdG8pICsgMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwYXJzZUZsb2F0KHBsYXRvKTtcbiAgICB9LFxuICAgIHJlY2lwZUJlZXJTbWl0aDogZnVuY3Rpb24ocmVjaXBlKXtcbiAgICAgIHZhciByZXNwb25zZSA9IHtuYW1lOicnLCBkYXRlOicnLCBicmV3ZXI6IHtuYW1lOicnfSwgY2F0ZWdvcnk6JycsIGFidjonJywgb2c6MC4wMDAsIGZnOjAuMDAwLCBpYnU6MCwgaG9wczpbXSwgZ3JhaW5zOltdLCB5ZWFzdDpbXSwgbWlzYzpbXX07XG4gICAgICBpZighIXJlY2lwZS5GX1JfTkFNRSlcbiAgICAgICAgcmVzcG9uc2UubmFtZSA9IHJlY2lwZS5GX1JfTkFNRTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfQ0FURUdPUlkpXG4gICAgICAgIHJlc3BvbnNlLmNhdGVnb3J5ID0gcmVjaXBlLkZfUl9TVFlMRS5GX1NfQ0FURUdPUlk7XG4gICAgICBpZighIXJlY2lwZS5GX1JfREFURSlcbiAgICAgICAgcmVzcG9uc2UuZGF0ZSA9IHJlY2lwZS5GX1JfREFURTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9CUkVXRVIpXG4gICAgICAgIHJlc3BvbnNlLmJyZXdlci5uYW1lID0gcmVjaXBlLkZfUl9CUkVXRVI7XG5cbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX09HKVxuICAgICAgICByZXNwb25zZS5vZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX09HKS50b0ZpeGVkKDMpO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9PRylcbiAgICAgICAgcmVzcG9uc2Uub2cgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9PRykudG9GaXhlZCgzKTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0ZHKVxuICAgICAgICByZXNwb25zZS5mZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0ZHKS50b0ZpeGVkKDMpO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9GRylcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9GRykudG9GaXhlZCgzKTtcblxuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfQUJWKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfQUJWLDIpO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9BQlYpXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9BQlYsMik7XG5cbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0lCVSlcbiAgICAgICAgcmVzcG9uc2UuaWJ1ID0gcGFyc2VJbnQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0lCVSwxMCk7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0lCVSlcbiAgICAgICAgcmVzcG9uc2UuaWJ1ID0gcGFyc2VJbnQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0lCVSwxMCk7XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuR3JhaW4pe1xuICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuR3JhaW4sZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgIHJlc3BvbnNlLmdyYWlucy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBncmFpbi5GX0dfTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQoZ3JhaW4uRl9HX0JPSUxfVElNRSwxMCksXG4gICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykoZ3JhaW4uRl9HX0FNT1VOVC8xNiwyKSsnIGxicy4nLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShncmFpbi5GX0dfQU1PVU5ULzE2LDIpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkhvcHMpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5Ib3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgICByZXNwb25zZS5ob3BzLnB1c2goe1xuICAgICAgICAgICAgICBsYWJlbDogaG9wLkZfSF9OQU1FLFxuICAgICAgICAgICAgICBtaW46IHBhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSA+IDAgPyBudWxsIDogcGFyc2VJbnQoaG9wLkZfSF9CT0lMX1RJTUUsMTApLFxuICAgICAgICAgICAgICBub3RlczogcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApID4gMFxuICAgICAgICAgICAgICAgID8gJ0RyeSBIb3AgJyskZmlsdGVyKCdudW1iZXInKShob3AuRl9IX0FNT1VOVCwyKSsnIG96LicrJyBmb3IgJytwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkrJyBEYXlzJ1xuICAgICAgICAgICAgICAgIDogJGZpbHRlcignbnVtYmVyJykoaG9wLkZfSF9BTU9VTlQsMikrJyBvei4nLFxuICAgICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKGhvcC5GX0hfQU1PVU5ULDIpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfQUxQSEFcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfRFJZX0hPUF9USU1FXG4gICAgICAgICAgICAvLyBob3AuRl9IX09SSUdJTlxuICAgICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2Mpe1xuICAgICAgICBpZihyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLmxlbmd0aCl7XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MsZnVuY3Rpb24obWlzYyl7XG4gICAgICAgICAgICByZXNwb25zZS5taXNjLnB1c2goe1xuICAgICAgICAgICAgICBsYWJlbDogbWlzYy5GX01fTkFNRSxcbiAgICAgICAgICAgICAgbWluOiBwYXJzZUludChtaXNjLkZfTV9USU1FLDEwKSxcbiAgICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ251bWJlcicpKG1pc2MuRl9NX0FNT1VOVCwyKSsnIGcuJyxcbiAgICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShtaXNjLkZfTV9BTU9VTlQsMilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3BvbnNlLm1pc2MucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5GX01fTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5GX01fVElNRSwxMCksXG4gICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5GX01fQU1PVU5ULDIpKycgZy4nLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9BTU9VTlQsMilcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0KXtcbiAgICAgICAgaWYocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QubGVuZ3RoKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QsZnVuY3Rpb24oeWVhc3Qpe1xuICAgICAgICAgICAgcmVzcG9uc2UueWVhc3QucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IHllYXN0LkZfWV9MQUIrJyAnKyh5ZWFzdC5GX1lfUFJPRFVDVF9JRCA/XG4gICAgICAgICAgICAgICAgeWVhc3QuRl9ZX1BST0RVQ1RfSUQgOlxuICAgICAgICAgICAgICAgIHllYXN0LkZfWV9OQU1FKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzcG9uc2UueWVhc3QucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfTEFCKycgJytcbiAgICAgICAgICAgICAgKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9QUk9EVUNUX0lEID9cbiAgICAgICAgICAgICAgICByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfUFJPRFVDVF9JRCA6XG4gICAgICAgICAgICAgICAgcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX05BTUUpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9LFxuICAgIHJlY2lwZUJlZXJYTUw6IGZ1bmN0aW9uKHJlY2lwZSl7XG4gICAgICB2YXIgcmVzcG9uc2UgPSB7bmFtZTonJywgZGF0ZTonJywgYnJld2VyOiB7bmFtZTonJ30sIGNhdGVnb3J5OicnLCBhYnY6JycsIG9nOjAuMDAwLCBmZzowLjAwMCwgaWJ1OjAsIGhvcHM6W10sIGdyYWluczpbXSwgeWVhc3Q6W10sIG1pc2M6W119O1xuICAgICAgdmFyIG1hc2hfdGltZSA9IDYwO1xuXG4gICAgICBpZighIXJlY2lwZS5OQU1FKVxuICAgICAgICByZXNwb25zZS5uYW1lID0gcmVjaXBlLk5BTUU7XG4gICAgICBpZighIXJlY2lwZS5TVFlMRS5DQVRFR09SWSlcbiAgICAgICAgcmVzcG9uc2UuY2F0ZWdvcnkgPSByZWNpcGUuU1RZTEUuQ0FURUdPUlk7XG5cbiAgICAgIC8vIGlmKCEhcmVjaXBlLkZfUl9EQVRFKVxuICAgICAgLy8gICByZXNwb25zZS5kYXRlID0gcmVjaXBlLkZfUl9EQVRFO1xuICAgICAgaWYoISFyZWNpcGUuQlJFV0VSKVxuICAgICAgICByZXNwb25zZS5icmV3ZXIubmFtZSA9IHJlY2lwZS5CUkVXRVI7XG5cbiAgICAgIGlmKCEhcmVjaXBlLk9HKVxuICAgICAgICByZXNwb25zZS5vZyA9IHBhcnNlRmxvYXQocmVjaXBlLk9HKS50b0ZpeGVkKDMpO1xuICAgICAgaWYoISFyZWNpcGUuRkcpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VGbG9hdChyZWNpcGUuRkcpLnRvRml4ZWQoMyk7XG5cbiAgICAgIGlmKCEhcmVjaXBlLklCVSlcbiAgICAgICAgcmVzcG9uc2UuaWJ1ID0gcGFyc2VJbnQocmVjaXBlLklCVSwxMCk7XG5cbiAgICAgIGlmKCEhcmVjaXBlLlNUWUxFLkFCVl9NQVgpXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5TVFlMRS5BQlZfTUFYLDIpO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5TVFlMRS5BQlZfTUlOKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuU1RZTEUuQUJWX01JTiwyKTtcblxuICAgICAgaWYoISFyZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUCAmJiByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUC5sZW5ndGggJiYgcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVBbMF0uU1RFUF9USU1FKXtcbiAgICAgICAgbWFzaF90aW1lID0gcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVBbMF0uU1RFUF9USU1FO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5GRVJNRU5UQUJMRVMpe1xuICAgICAgICB2YXIgZ3JhaW5zID0gKHJlY2lwZS5GRVJNRU5UQUJMRVMuRkVSTUVOVEFCTEUgJiYgcmVjaXBlLkZFUk1FTlRBQkxFUy5GRVJNRU5UQUJMRS5sZW5ndGgpID8gcmVjaXBlLkZFUk1FTlRBQkxFUy5GRVJNRU5UQUJMRSA6IHJlY2lwZS5GRVJNRU5UQUJMRVM7XG4gICAgICAgIF8uZWFjaChncmFpbnMsZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgIHJlc3BvbnNlLmdyYWlucy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBncmFpbi5OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChtYXNoX3RpbWUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ251bWJlcicpKGdyYWluLkFNT1VOVCwyKSsnIGxicy4nLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShncmFpbi5BTU9VTlQsMiksXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5IT1BTKXtcbiAgICAgICAgdmFyIGhvcHMgPSAocmVjaXBlLkhPUFMuSE9QICYmIHJlY2lwZS5IT1BTLkhPUC5sZW5ndGgpID8gcmVjaXBlLkhPUFMuSE9QIDogcmVjaXBlLkhPUFM7XG4gICAgICAgIF8uZWFjaChob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgcmVzcG9uc2UuaG9wcy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBob3AuTkFNRSsnICgnK2hvcC5GT1JNKycpJyxcbiAgICAgICAgICAgIG1pbjogaG9wLlVTRSA9PSAnRHJ5IEhvcCcgPyAwIDogcGFyc2VJbnQoaG9wLlRJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6IGhvcC5VU0UgPT0gJ0RyeSBIb3AnXG4gICAgICAgICAgICAgID8gaG9wLlVTRSsnICcrJGZpbHRlcignbnVtYmVyJykoaG9wLkFNT1VOVCoxMDAwLzI4LjM0OTUsMikrJyBvei4nKycgZm9yICcrcGFyc2VJbnQoaG9wLlRJTUUvNjAvMjQsMTApKycgRGF5cydcbiAgICAgICAgICAgICAgOiBob3AuVVNFKycgJyskZmlsdGVyKCdudW1iZXInKShob3AuQU1PVU5UKjEwMDAvMjguMzQ5NSwyKSsnIG96LicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKGhvcC5BTU9VTlQqMTAwMC8yOC4zNDk1LDIpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5NSVNDUyl7XG4gICAgICAgIHZhciBtaXNjID0gKHJlY2lwZS5NSVNDUy5NSVNDICYmIHJlY2lwZS5NSVNDUy5NSVNDLmxlbmd0aCkgPyByZWNpcGUuTUlTQ1MuTUlTQyA6IHJlY2lwZS5NSVNDUztcbiAgICAgICAgXy5lYWNoKG1pc2MsZnVuY3Rpb24obWlzYyl7XG4gICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBtaXNjLk5BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KG1pc2MuVElNRSwxMCksXG4gICAgICAgICAgICBub3RlczogJ0FkZCAnK21pc2MuQU1PVU5UKycgdG8gJyttaXNjLlVTRSxcbiAgICAgICAgICAgIGFtb3VudDogbWlzYy5BTU9VTlRcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLllFQVNUUyl7XG4gICAgICAgIHZhciB5ZWFzdCA9IChyZWNpcGUuWUVBU1RTLllFQVNUICYmIHJlY2lwZS5ZRUFTVFMuWUVBU1QubGVuZ3RoKSA/IHJlY2lwZS5ZRUFTVFMuWUVBU1QgOiByZWNpcGUuWUVBU1RTO1xuICAgICAgICAgIF8uZWFjaCh5ZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogeWVhc3QuTkFNRVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfSxcbiAgICBmb3JtYXRYTUw6IGZ1bmN0aW9uKGNvbnRlbnQpe1xuICAgICAgdmFyIGh0bWxjaGFycyA9IFtcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJyYjMjYyOycsIHI6ICfEhid9LFxuICAgICAgICB7ZjogJyYjMjYzOycsIHI6ICfEhyd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcyOycsIHI6ICfEkCd9LFxuICAgICAgICB7ZjogJyYjMjczOycsIHI6ICfEkSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MDsnLCByOiAnxI4nfSxcbiAgICAgICAge2Y6ICcmIzI3MTsnLCByOiAnxI8nfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJiMyODI7JywgcjogJ8SaJ30sXG4gICAgICAgIHtmOiAnJiMyODM7JywgcjogJ8SbJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyYjMzI3OycsIHI6ICfFhyd9LFxuICAgICAgICB7ZjogJyYjMzI4OycsIHI6ICfFiCd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzM0NDsnLCByOiAnxZgnfSxcbiAgICAgICAge2Y6ICcmIzM0NTsnLCByOiAnxZknfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1NjsnLCByOiAnxaQnfSxcbiAgICAgICAge2Y6ICcmIzM1NzsnLCByOiAnxaUnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJiMzNjY7JywgcjogJ8WuJ30sXG4gICAgICAgIHtmOiAnJiMzNjc7JywgcjogJ8WvJ30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzI2NDsnLCByOiAnxIgnfSxcbiAgICAgICAge2Y6ICcmIzI2NTsnLCByOiAnxIknfSxcbiAgICAgICAge2Y6ICcmIzI4NDsnLCByOiAnxJwnfSxcbiAgICAgICAge2Y6ICcmIzI4NTsnLCByOiAnxJ0nfSxcbiAgICAgICAge2Y6ICcmIzI5MjsnLCByOiAnxKQnfSxcbiAgICAgICAge2Y6ICcmIzI5MzsnLCByOiAnxKUnfSxcbiAgICAgICAge2Y6ICcmIzMwODsnLCByOiAnxLQnfSxcbiAgICAgICAge2Y6ICcmIzMwOTsnLCByOiAnxLUnfSxcbiAgICAgICAge2Y6ICcmIzM0ODsnLCByOiAnxZwnfSxcbiAgICAgICAge2Y6ICcmIzM0OTsnLCByOiAnxZ0nfSxcbiAgICAgICAge2Y6ICcmIzM2NDsnLCByOiAnxawnfSxcbiAgICAgICAge2Y6ICcmIzM2NTsnLCByOiAnxa0nfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmT3RpbGRlOycsIHI6ICfDlSd9LFxuICAgICAgICB7ZjogJyZvdGlsZGU7JywgcjogJ8O1J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFVEg7JywgcjogJ8OQJ30sXG4gICAgICAgIHtmOiAnJmV0aDsnLCByOiAnw7AnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPY2lyYzsnLCByOiAnw5QnfSxcbiAgICAgICAge2Y6ICcmb2NpcmM7JywgcjogJ8O0J30sXG4gICAgICAgIHtmOiAnJk9FbGlnOycsIHI6ICfFkid9LFxuICAgICAgICB7ZjogJyZvZWxpZzsnLCByOiAnxZMnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVjaXJjOycsIHI6ICfDmyd9LFxuICAgICAgICB7ZjogJyZ1Y2lyYzsnLCByOiAnw7snfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmIzM3NjsnLCByOiAnxbgnfSxcbiAgICAgICAge2Y6ICcmeXVtbDsnLCByOiAnw78nfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmc3psaWc7JywgcjogJ8OfJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkF0aWxkZTsnLCByOiAnw4MnfSxcbiAgICAgICAge2Y6ICcmYXRpbGRlOycsIHI6ICfDoyd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyYjMjk2OycsIHI6ICfEqCd9LFxuICAgICAgICB7ZjogJyYjMjk3OycsIHI6ICfEqSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyYjMzYwOycsIHI6ICfFqCd9LFxuICAgICAgICB7ZjogJyYjMzYxOycsIHI6ICfFqSd9LFxuICAgICAgICB7ZjogJyYjMzEyOycsIHI6ICfEuCd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmIzMzNjsnLCByOiAnxZAnfSxcbiAgICAgICAge2Y6ICcmIzMzNzsnLCByOiAnxZEnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJiMzNjg7JywgcjogJ8WwJ30sXG4gICAgICAgIHtmOiAnJiMzNjk7JywgcjogJ8WxJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFVEg7JywgcjogJ8OQJ30sXG4gICAgICAgIHtmOiAnJmV0aDsnLCByOiAnw7AnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyZUSE9STjsnLCByOiAnw54nfSxcbiAgICAgICAge2Y6ICcmdGhvcm47JywgcjogJ8O+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZJZ3JhdmU7JywgcjogJ8OMJ30sXG4gICAgICAgIHtmOiAnJmlncmF2ZTsnLCByOiAnw6wnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVjaXJjOycsIHI6ICfDmyd9LFxuICAgICAgICB7ZjogJyZ1Y2lyYzsnLCByOiAnw7snfSxcbiAgICAgICAge2Y6ICcmIzI1NjsnLCByOiAnxIAnfSxcbiAgICAgICAge2Y6ICcmIzI1NzsnLCByOiAnxIEnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3NDsnLCByOiAnxJInfSxcbiAgICAgICAge2Y6ICcmIzI3NTsnLCByOiAnxJMnfSxcbiAgICAgICAge2Y6ICcmIzI5MDsnLCByOiAnxKInfSxcbiAgICAgICAge2Y6ICcmIzI5MTsnLCByOiAnxKMnfSxcbiAgICAgICAge2Y6ICcmIzI5ODsnLCByOiAnxKonfSxcbiAgICAgICAge2Y6ICcmIzI5OTsnLCByOiAnxKsnfSxcbiAgICAgICAge2Y6ICcmIzMxMDsnLCByOiAnxLYnfSxcbiAgICAgICAge2Y6ICcmIzMxMTsnLCByOiAnxLcnfSxcbiAgICAgICAge2Y6ICcmIzMxNTsnLCByOiAnxLsnfSxcbiAgICAgICAge2Y6ICcmIzMxNjsnLCByOiAnxLwnfSxcbiAgICAgICAge2Y6ICcmIzMyNTsnLCByOiAnxYUnfSxcbiAgICAgICAge2Y6ICcmIzMyNjsnLCByOiAnxYYnfSxcbiAgICAgICAge2Y6ICcmIzM0MjsnLCByOiAnxZYnfSxcbiAgICAgICAge2Y6ICcmIzM0MzsnLCByOiAnxZcnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM2MjsnLCByOiAnxaonfSxcbiAgICAgICAge2Y6ICcmIzM2MzsnLCByOiAnxasnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXJpbmc7JywgcjogJ8OFJ30sXG4gICAgICAgIHtmOiAnJmFyaW5nOycsIHI6ICfDpSd9LFxuICAgICAgICB7ZjogJyYjMjYwOycsIHI6ICfEhCd9LFxuICAgICAgICB7ZjogJyYjMjYxOycsIHI6ICfEhSd9LFxuICAgICAgICB7ZjogJyYjMjYyOycsIHI6ICfEhid9LFxuICAgICAgICB7ZjogJyYjMjYzOycsIHI6ICfEhyd9LFxuICAgICAgICB7ZjogJyYjMjgwOycsIHI6ICfEmCd9LFxuICAgICAgICB7ZjogJyYjMjgxOycsIHI6ICfEmSd9LFxuICAgICAgICB7ZjogJyYjMzIxOycsIHI6ICfFgSd9LFxuICAgICAgICB7ZjogJyYjMzIyOycsIHI6ICfFgid9LFxuICAgICAgICB7ZjogJyYjMzIzOycsIHI6ICfFgyd9LFxuICAgICAgICB7ZjogJyYjMzI0OycsIHI6ICfFhCd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzM0NjsnLCByOiAnxZonfSxcbiAgICAgICAge2Y6ICcmIzM0NzsnLCByOiAnxZsnfSxcbiAgICAgICAge2Y6ICcmIzM3NzsnLCByOiAnxbknfSxcbiAgICAgICAge2Y6ICcmIzM3ODsnLCByOiAnxbonfSxcbiAgICAgICAge2Y6ICcmIzM3OTsnLCByOiAnxbsnfSxcbiAgICAgICAge2Y6ICcmIzM4MDsnLCByOiAnxbwnfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkF0aWxkZTsnLCByOiAnw4MnfSxcbiAgICAgICAge2Y6ICcmYXRpbGRlOycsIHI6ICfDoyd9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPdGlsZGU7JywgcjogJ8OVJ30sXG4gICAgICAgIHtmOiAnJm90aWxkZTsnLCByOiAnw7UnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZvcmRmOycsIHI6ICfCqid9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyYjMjU4OycsIHI6ICfEgid9LFxuICAgICAgICB7ZjogJyYjMjU5OycsIHI6ICfEgyd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmIzM1MDsnLCByOiAnxZ4nfSxcbiAgICAgICAge2Y6ICcmIzM1MTsnLCByOiAnxZ8nfSxcbiAgICAgICAge2Y6ICcmIzM1NDsnLCByOiAnxaInfSxcbiAgICAgICAge2Y6ICcmIzM1NTsnLCByOiAnxaMnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzMzA7JywgcjogJ8WKJ30sXG4gICAgICAgIHtmOiAnJiMzMzE7JywgcjogJ8WLJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNTg7JywgcjogJ8WmJ30sXG4gICAgICAgIHtmOiAnJiMzNTk7JywgcjogJ8WnJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVncmF2ZTsnLCByOiAnw5knfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MDsnLCByOiAnxI4nfSxcbiAgICAgICAge2Y6ICcmIzI3MTsnLCByOiAnxI8nfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJiMzMTM7JywgcjogJ8S5J30sXG4gICAgICAgIHtmOiAnJiMzMTQ7JywgcjogJ8S6J30sXG4gICAgICAgIHtmOiAnJiMzMTc7JywgcjogJ8S9J30sXG4gICAgICAgIHtmOiAnJiMzMTg7JywgcjogJ8S+J30sXG4gICAgICAgIHtmOiAnJiMzMjc7JywgcjogJ8WHJ30sXG4gICAgICAgIHtmOiAnJiMzMjg7JywgcjogJ8WIJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPY2lyYzsnLCByOiAnw5QnfSxcbiAgICAgICAge2Y6ICcmb2NpcmM7JywgcjogJ8O0J30sXG4gICAgICAgIHtmOiAnJiMzNDA7JywgcjogJ8WUJ30sXG4gICAgICAgIHtmOiAnJiMzNDE7JywgcjogJ8WVJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNTY7JywgcjogJ8WkJ30sXG4gICAgICAgIHtmOiAnJiMzNTc7JywgcjogJ8WlJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk50aWxkZTsnLCByOiAnw5EnfSxcbiAgICAgICAge2Y6ICcmbnRpbGRlOycsIHI6ICfDsSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmaWV4Y2w7JywgcjogJ8KhJ30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJmlxdWVzdDsnLCByOiAnwr8nfSxcbiAgICAgICAge2Y6ICcmb3JkbTsnLCByOiAnwronfSxcbiAgICAgICAge2Y6ICcmQXJpbmc7JywgcjogJ8OFJ30sXG4gICAgICAgIHtmOiAnJmFyaW5nOycsIHI6ICfDpSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmIzI4NjsnLCByOiAnxJ4nfSxcbiAgICAgICAge2Y6ICcmIzI4NzsnLCByOiAnxJ8nfSxcbiAgICAgICAge2Y6ICcmIzMwNDsnLCByOiAnxLAnfSxcbiAgICAgICAge2Y6ICcmIzMwNTsnLCByOiAnxLEnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmIzM1MDsnLCByOiAnxZ4nfSxcbiAgICAgICAge2Y6ICcmIzM1MTsnLCByOiAnxZ8nfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmZXVybzsnLCByOiAn4oKsJ30sXG4gICAgICAgIHtmOiAnJnBvdW5kOycsIHI6ICfCoyd9LFxuICAgICAgICB7ZjogJyZsYXF1bzsnLCByOiAnwqsnfSxcbiAgICAgICAge2Y6ICcmcmFxdW87JywgcjogJ8K7J30sXG4gICAgICAgIHtmOiAnJmJ1bGw7JywgcjogJ+KAoid9LFxuICAgICAgICB7ZjogJyZkYWdnZXI7JywgcjogJ+KAoCd9LFxuICAgICAgICB7ZjogJyZjb3B5OycsIHI6ICfCqSd9LFxuICAgICAgICB7ZjogJyZyZWc7JywgcjogJ8KuJ30sXG4gICAgICAgIHtmOiAnJnRyYWRlOycsIHI6ICfihKInfSxcbiAgICAgICAge2Y6ICcmZGVnOycsIHI6ICfCsCd9LFxuICAgICAgICB7ZjogJyZwZXJtaWw7JywgcjogJ+KAsCd9LFxuICAgICAgICB7ZjogJyZtaWNybzsnLCByOiAnwrUnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJyZuZGFzaDsnLCByOiAn4oCTJ30sXG4gICAgICAgIHtmOiAnJm1kYXNoOycsIHI6ICfigJQnfSxcbiAgICAgICAge2Y6ICcmIzg0NzA7JywgcjogJ+KElid9LFxuICAgICAgICB7ZjogJyZyZWc7JywgcjogJ8KuJ30sXG4gICAgICAgIHtmOiAnJnBhcmE7JywgcjogJ8K2J30sXG4gICAgICAgIHtmOiAnJnBsdXNtbjsnLCByOiAnwrEnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJ2xlc3MtdCcsIHI6ICc8J30sXG4gICAgICAgIHtmOiAnZ3JlYXRlci10JywgcjogJz4nfSxcbiAgICAgICAge2Y6ICcmbm90OycsIHI6ICfCrCd9LFxuICAgICAgICB7ZjogJyZjdXJyZW47JywgcjogJ8KkJ30sXG4gICAgICAgIHtmOiAnJmJydmJhcjsnLCByOiAnwqYnfSxcbiAgICAgICAge2Y6ICcmZGVnOycsIHI6ICfCsCd9LFxuICAgICAgICB7ZjogJyZhY3V0ZTsnLCByOiAnwrQnfSxcbiAgICAgICAge2Y6ICcmdW1sOycsIHI6ICfCqCd9LFxuICAgICAgICB7ZjogJyZtYWNyOycsIHI6ICfCryd9LFxuICAgICAgICB7ZjogJyZjZWRpbDsnLCByOiAnwrgnfSxcbiAgICAgICAge2Y6ICcmbGFxdW87JywgcjogJ8KrJ30sXG4gICAgICAgIHtmOiAnJnJhcXVvOycsIHI6ICfCuyd9LFxuICAgICAgICB7ZjogJyZzdXAxOycsIHI6ICfCuSd9LFxuICAgICAgICB7ZjogJyZzdXAyOycsIHI6ICfCsid9LFxuICAgICAgICB7ZjogJyZzdXAzOycsIHI6ICfCsyd9LFxuICAgICAgICB7ZjogJyZvcmRmOycsIHI6ICfCqid9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyZpZXhjbDsnLCByOiAnwqEnfSxcbiAgICAgICAge2Y6ICcmaXF1ZXN0OycsIHI6ICfCvyd9LFxuICAgICAgICB7ZjogJyZtaWNybzsnLCByOiAnwrUnfSxcbiAgICAgICAge2Y6ICdoeTtcdCcsIHI6ICcmJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZOdGlsZGU7JywgcjogJ8ORJ30sXG4gICAgICAgIHtmOiAnJm50aWxkZTsnLCByOiAnw7EnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJnN6bGlnOycsIHI6ICfDnyd9LFxuICAgICAgICB7ZjogJyZhbXA7JywgcjogJ2FuZCd9LFxuICAgICAgICB7ZjogJyZsZHF1bzsnLCByOiAnXCInfSxcbiAgICAgICAge2Y6ICcmcmRxdW87JywgcjogJ1wiJ30sXG4gICAgICAgIHtmOiAnJnJzcXVvOycsIHI6IFwiJ1wifVxuICAgICAgXTtcblxuICAgICAgXy5lYWNoKGh0bWxjaGFycywgZnVuY3Rpb24oY2hhcikge1xuICAgICAgICBpZihjb250ZW50LmluZGV4T2YoY2hhci5mKSAhPT0gLTEpe1xuICAgICAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoUmVnRXhwKGNoYXIuZiwnZycpLCBjaGFyLnIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBjb250ZW50O1xuICAgIH1cbiAgfTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL3NlcnZpY2VzLmpzIl0sInNvdXJjZVJvb3QiOiIifQ==