define([
	'scripts/upfront/preset-settings/preset-manager',
	'scripts/upfront/preset-settings/util',
	
	'elements/upfront-post-data/js/modules-post_data',
	'elements/upfront-post-data/js/modules-author',
	'elements/upfront-post-data/js/modules-featured_image',
	'elements/upfront-post-data/js/modules-taxonomies',
	'elements/upfront-post-data/js/modules-comments'
], function (
	PresetManager,
	Util,

	Modules_PostData,
	Modules_Author,
	Modules_FeaturedImage,
	Modules_Taxonomies,
	Modules_Comments
) {

	var Templates = {
		post_data: Modules_PostData.template,
		author: Modules_Author.template,
		featured_image: Modules_FeaturedImage.template,
		taxonomy: Modules_Taxonomies.template,
		comments: Modules_Comments.template,
	};


	var Modules = _.extend(
		{}, 
		_.omit(Modules_PostData, 'template'),
		_.omit(Modules_Author, 'template'),
		_.omit(Modules_FeaturedImage, 'template'),
		_.omit(Modules_Taxonomies, 'template'),
		_.omit(Modules_Comments, 'template')
	);



	var Main = PresetManager.extend({
		initialize: function () {
			var data_type_idx = 'upfront_post_data_' + this.data_type,
				data_type_defaults = {}
			;

			// Set up data type specific defaults, to use as default preset
			_(_.omit(Upfront.data[data_type_idx], ['class', 'data_type', 'has_settings', 'id_slug', 'type', 'type_parts', 'view_class'])).each(function (property, key) {
				data_type_defaults[key] = property;
			});

			_.extend(this, {
				mainDataCollection: this.data_type + '_elementPresets',
				styleElementPrefix: this.data_type,
				ajaxActionSlug: this.data_type + '_element',
				styleTpl: Templates[this.data_type],
				presetDefaults: _.extend(data_type_defaults, {
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
			var preset = this.property('preset') ? this.clear_preset_name(this.property('preset')) : 'default';
			var preset_model = this.presets.findWhere({id: preset});

			// So what do we do when we don't have the appropriate preset model?
			if (!preset_model) {
				// Why, spawn the default, of course!
				preset = 'default';
				this.property('preset', preset);
				preset_model = this.presets.findWhere({id: preset});
			}
			
			PresetManager.prototype.setupItems.apply(this, arguments);

			_.each(this.part_panels, function (panel, idx) {
				var pnl = new panel({
					model: preset_model
				});

				var me = this;
				this.listenTo(pnl, "part:hide:toggle", function () {
					this.updatePreset(preset_model.toJSON());
				}, this);

				this.settings.push(pnl);
			}, this);
		},
		getTitle: function() {
			return 'Presets';
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
			_.each(Upfront.data['upfront_post_data_' + data_type].type_parts, function (part) {
				var part_name = 'part_' + part,
					option = Modules[part_name] ? Modules[part_name] : false
				;
				if (!option) return;

				pnls[part] = option;
			});

			var overall = Main.extend({part_panels: pnls, data_type: data_type});

			return {stuff: overall};
		}
	}

});