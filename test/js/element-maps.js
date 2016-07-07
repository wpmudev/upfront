var assert = require('assert'),
	extend = require('./lib/extend')
;

describe('Elements', function () {

	describe('Maps', function () {

		before(function () {
			/**
			 * Mock jQuery as global object
			 *
			 * @type {Object}
			 */
			global.jQuery = function () {
				return {
					append: function () {}
				};
			};

			global.window = {};

			global.Backbone = {
				View: {
					extend: extend
				}
			};

			/**
			 * Testable object which receives the model definitions
			 *
			 * @type {Object}
			 */
			global.Testable = {};

			global.ContextMenu = function () {

			};

			/**
			 * Mock Upfront global object
			 *
			 * @type {Object}
			 */
			global.Upfront = {
				Settings: {
					l10n: {
						maps_element: {
							css: {label: '', info: ''},
							connectivity_warning: 'test warning',
							menu: {}
						}
					}
				},
				Models: {
					ObjectModel: function () {}
				},
				Views: {
					Editor: {
						Field: {
							Checkboxes: {
								extend: extend
							},
							Text: {
								extend: extend
							}
						},
						Sidebar: {
							Element: function () {}
						},
						Settings: {
							Item: {
								extend: extend
							}
						}
					},
					ObjectView: function () {}
				},
				Application: {
					LayoutEditor: {
						add_object: function (type, hash) {
							Testable = hash;
						}
					},
					user_can_modify_layout: function () { return false; }
				},
				Util: {
					get_unique_id: function (a) { return a; }
				},
				data: {
					umaps: {
						defaults: {
							type: 'MapModel',
							id_slug: 'test',
							map_center: [0, 0]
						}
					}
				}
			};

			Upfront.Models.ObjectModel.extend =
				Upfront.Views.ObjectView.extend =
				Upfront.Views.Editor.Sidebar.Element.extend =
			extend;

			/**
			 * Mock define implementation.
			 */
			global.define = function () {
				var args = Array.prototype.slice.call(arguments);
					cback = args.pop()
				;
				cback.apply(this, [{}, {}, {extend: extend}, {extend: extend}, {}]);
			};

			global.navigator = false;

			require('../../elements/upfront-maps/js/upfront_maps.js');
		});

		describe('Element', function () {

			it('should define an element', function (done) {
				assert(Testable.Element);
				done();
			});

			it('should have priority 50', function (done) {
				var element = new Testable.Element();
				assert.deepEqual(50, element.priority);
				done();
			});
		});

		describe('Model', function () {

			it('should define a model', function (done) {
				assert(Testable.Model);
				done();
			});

			it('should initialize properties', function (done) {
				var properties = {},
					model = new Testable.Model()
				;
				model.init_properties = function (props) { properties = props; };
				model.init();

				assert.deepEqual('MapModel', properties.type);
				assert.deepEqual('test', properties.id_slug);
				assert.deepEqual('test-object', properties.element_id);
				done();
			});

		});

		describe('View', function () {

			it('should define a view', function (done) {
				assert(Testable.View);
				done();
			});

			it('should instantiate map', function (done) {
				var view = new Testable.View(),
					values = {}
				;

				view.listenTo = function () {};
				view.init();

				view.update_properties = function () {};
				view.model = {
					get_breakpoint_property_value: function () {},
					get_property_value_by_name: function () { return false; }
				};
				view.$el = {
					find: function () { return this; },
					get: function () { return ['']; },
					css: function () { values.css = arguments[0]; },
					on: function (handler, cback) { return this; },
					off: function (handler, cback) { return this; },
					html: function (html) { values.html = html; },
					append: function () {},
					empty: function () {},
					end: function () { return this; },
					hide: function () {}
				};
				view.parent_module_view = {
					model: view.model
				};

				window.google = {
					maps: {
						Map: function (el, hash) {
							values.map = hash;
						},
						LatLng: function (a, b) { return [a, b]; },
						MapTypeId: { ROADMAP: 'roadmap' },
						event: {
							addListener: function () {}
						}
					}
				};
				global.google = window.google;

				view.on_render();

				assert.deepEqual('300px', values.css.height);
				assert.deepEqual([0, 0], values.map.center);
				assert.deepEqual('roadmap', values.map.mapTypeId);
				assert.deepEqual(10, values.map.zoom);

				// Test connectivity issue
				delete(window.google);
				view.on_render();
				assert(values.html.match(/test warning/));

				done();
			});

		});

		describe('Settings', function () {

			it('should define settings', function (done) {
				assert(Testable.Settings);
				done();
			});

		});
	});
});
