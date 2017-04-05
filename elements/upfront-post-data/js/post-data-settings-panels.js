define([
	'scripts/upfront/preset-settings/preset-manager',
	'scripts/upfront/preset-settings/util',

	'elements/upfront-post-data/js/modules-post_data',
	'elements/upfront-post-data/js/modules-author',
	'elements/upfront-post-data/js/modules-featured_image',
	'elements/upfront-post-data/js/modules-taxonomies',
	'elements/upfront-post-data/js/modules-comments',
	'elements/upfront-post-data/js/modules-meta'
], function (
	PresetManager,
	Util,

	Modules_PostData,
	Modules_Author,
	Modules_FeaturedImage,
	Modules_Taxonomies,
	Modules_Comments,
	Modules_Meta
) {

	var Templates = {
		post_data: Modules_PostData.template,
		author: Modules_Author.template,
		featured_image: Modules_FeaturedImage.template,
		taxonomy: Modules_Taxonomies.template,
		comments: Modules_Comments.template,
		meta: Modules_Meta.template
	};


	var Modules = _.extend(
		{},
		_.omit(Modules_PostData, 'template'),
		_.omit(Modules_Author, 'template'),
		_.omit(Modules_FeaturedImage, 'template'),
		_.omit(Modules_Taxonomies, 'template'),
		_.omit(Modules_Comments, 'template'),
		_.omit(Modules_Meta, 'template')
	);



	var Main = PresetManager.extend({
		initialize: function () {
			var data_type_idx = 'upfront_post_data_' + this.data_type,
				data_type_defaults = {},
				elementDefaults
			;

			// Set up data type specific defaults, to use as default preset
			_(_.omit(Upfront.data[data_type_idx], ['class', 'data_type', 'has_settings', 'id_slug', 'type', 'type_parts', 'view_class'])).each(function (property, key) {
				data_type_defaults[key] = property;
			});

			// Include default settings from Upfront.mainData
			if(typeof Upfront.mainData.presetDefaults[this.data_type + '_element'] !== "undefined") {
				elementDefaults = _.extend(data_type_defaults, Upfront.mainData.presetDefaults[this.data_type + '_element']);
			} else {
				elementDefaults = data_type_defaults;
			}

			_.extend(this, {
				mainDataCollection: this.data_type + '_elementPresets',
				styleElementPrefix: this.data_type + '_element',
				ajaxActionSlug: this.data_type + '_element',
				styleTpl: Templates[this.data_type],
				presetDefaults: _.extend(elementDefaults, {
					id: "default",
					name: "Default"
				})
			});

			PresetManager.prototype.initialize.apply(this, arguments);

			this.listenTo(this.model, 'preset:updated', function () {
				this.model.get("objects").trigger("change");
			}, this);

			// HACK!!! Force element type so the css editor works
			Upfront.Application.cssEditor.elementTypes.PostDataModel = Upfront.Application.cssEditor.elementTypes.PostDataModel || {id: this.data_type, label: this.data_type};
		},
		setupItems: function () {
			var preset = this.clear_preset_name(this.model.decode_preset() || 'default');
			var preset_model = this.presets.findWhere({id: preset});

			// So what do we do when we don't have the appropriate preset model?
			if (!preset_model) {
				// Why, spawn the default, of course!
				preset = 'default';
				this.property('preset', preset);
				preset_model = this.presets.findWhere({id: preset});
			}

			PresetManager.prototype.setupItems.apply(this, arguments);

			// Make sure we update hidden objects on preset change
			if (this.selectPresetModule) this.listenTo(this.selectPresetModule, 'upfront:presets:change', function () {
				this.model.get("objects").trigger("change");
				var me = this;
				setTimeout(function(){
					me.update_parts();
				});
			}, this);
			// If properties changed (i.e cancel)
			this.listenTo(this.model, 'change', function (attr) {
				if ( !('changed' in attr && 'properties' in attr.changed)  ) return;
				var me = this;
				setTimeout(function(){
					me.update_parts();
				});
			}, this);
			// Yeah, so that's done

			_.each(this.part_panels, function (panel, idx) {
				var pnl = new panel({
					model: preset_model
				});

				var me = this;
				this.listenTo(pnl, "part:hide:toggle", function (part_type, enable) {
					this.update_parts();
					//this.updatePreset(preset_model.toJSON()); // Not needed, since we're sending (current local) preset data with request
					this.updatePreset(preset_model.toJSON()); // Update: actually *still* needed, because presets aren't necessarily being saved on preset save...
				}, this);

				this.settings.push(pnl);
			}, this);
		},
		getTitle: function() {
			return 'Presets';
		},

		update_parts: function () {
			var me = this,
				preset = this.property("preset"),
				preset_model = this.presets.findWhere({id: preset}),
				hidden_parts = preset_model.get("hidden_parts") || [],
				parts = this.model.get_property_value_by_name("type_parts") || [],
				breakpoints = Upfront.Views.breakpoints_storage.get_breakpoints().get_enabled(),
				active_breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON()
			;
			_.each(parts, function (part) {
				me.update_object(part, hidden_parts.indexOf(part) < 0);
			});
			if  ( active_breakpoint['default'] ) {
				// Also update the responsive part
				_.each(breakpoints, function (breakpoint) {
					breakpoint = breakpoint.toJSON();
					var breakpoint_presets = me.property("breakpoint_presets");
					if ( breakpoint['default'] ) return;
					if ( !breakpoint_presets ) return;
					if ( !(breakpoint.id in breakpoint_presets) || !('preset' in breakpoint_presets[breakpoint.id]) ) return;
					var preset = breakpoint_presets[breakpoint.id].preset,
						preset_model = me.presets.findWhere({id: preset}),
						hidden_parts = preset_model.get("hidden_parts") || []
					;
					_.each(parts, function (part) {
						me.update_object(part, hidden_parts.indexOf(part) < 0, breakpoint);
					});
				});
			}
			this.model.get("objects").trigger("change");
		},

		has_object: function (type) {
			return ( this.find_object(type) ? true : false );
		},
		find_object: function (type) {
			var objects = this.model.get('objects');
			if ( !objects ) return false;
			return objects.find(function(object){
				var part_type = object.get_property_value_by_name('part_type');
				if ( type == part_type ) return true;
				return false;
			});
		},
		find_wrapper: function (object) {
			var wrappers = this.model.get('wrappers'),
				wrapper_id = object.get_wrapper_id()
			;
			return wrappers.get_by_wrapper_id(wrapper_id);
		},
		update_object: function (type, enable, breakpoint) {
			enable = !!enable;
			breakpoint = breakpoint ? breakpoint : Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON();
			var objects = this.model.get('objects'),
				wrappers = this.model.get('wrappers'),
				object = this.find_object(type)
			;
			if ( breakpoint['default'] ) {
				// Default breakpoint, actually add/remove objects
				if ( !object && enable ) {
					var wrapper_id = Upfront.Util.get_unique_id("wrapper"),
						wrapper = new Upfront.Models.Wrapper({
							properties: [
								{ name: 'wrapper_id', value: wrapper_id },
								{ name: 'class', value: 'c24 clr' }
							]
						})
					;
					object = new Upfront.Models.PostDataPartModel({
						properties: [
							{ name: 'view_class', value: 'PostDataPartView' },
							{ name: 'part_type', value: type },
							{ name: 'has_settings', value: 0 },
							{ name: 'class', value: 'c24 upfront-post-data-part part-'+type },
							{ name: 'wrapper_id', value: wrapper_id }
						]
					});
					wrappers.add(wrapper, {silent: true});
					objects.add(object);
				}
				else if ( object && !enable ) {
					var object_view = Upfront.data.object_views[object.cid];
					object_view.parent_view.on_entity_remove(null, object_view);
				}
			}
			else {
				// On responsive, just hide/show available object
				if ( object ) {
					object.set_breakpoint_property('hide', (enable ? 0 : 1), false, breakpoint);
				}
			}
		}
	});

	// Boot up preset styles
	_.each(Templates, function (tpl, el) {
		var element = el + '_element';
		Util.generatePresetsToPage(element, tpl);
	});

	return {
		get_panel: function (data_type) {
			var pnls = {};
			if (Upfront.Application.user_can("MODIFY_PRESET")) _.each(Upfront.data['upfront_post_data_' + data_type].type_parts, function (part) {
				var part_name = 'part_' + part,
					option = Modules[part_name] ? Modules[part_name] : false
				;
				if (!option) return;

				pnls[part] = option;
			});

			// Do not show any post parts if we are doing compat display
			if (Upfront.Application.is_plugin_layout())  {
				pnls = {};
			}

			var overall = Main.extend({part_panels: pnls, data_type: data_type});

			return {stuff: overall};
		}
	};

});
