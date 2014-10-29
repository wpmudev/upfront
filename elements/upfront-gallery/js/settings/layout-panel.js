(function ($) {
define([
	'elements/upfront-gallery/js/settings/thumbnail-fields'
], function(ThumbnailFields) {
	var l10n = Upfront.Settings.l10n.gallery_element;

	var LayoutPanel = Upfront.Views.Editor.Settings.Panel.extend({
		className: 'upfront-settings_panel_wrap ugallery-settings',
		initialize: function (opts) {
			this.options = opts;
			var me = this,
				fields = Upfront.Views.Editor.Field,
				spectrum,
				currentColor;

			this.settings = _([
				new Upfront.Views.Editor.Settings.Item({
					group: false,
					fields: [
						new fields.Checkboxes({
							model: this.model,
							className: 'upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-checkboxes ugallery-setting-labels',
							property: 'labelFilters',
							values: [
								{
									value: 'true',
									label: l10n.panel.sort
								}
							]
						})
					]
				}),
				new ThumbnailFields({model: this.model}),
				new Upfront.Views.Editor.Settings.Item({
					title: 'Caption Settings',
					fields: [
						new fields.Radios({
							model: this.model,
							property: 'captionWhen',
							layout: 'horizontal-inline',
							label: l10n.panel.show_caption,
							values: [
								{value: 'never', label: l10n.panel.never},
								{value: 'hover', label: l10n.panel.hover},
								{value: 'always', label: l10n.panel.always}
							]
						}),
						new fields.Radios({
							model: this.model,
							property: 'captionPosition',
							layout: 'horizontal-inline',
							label: l10n.panel.caption_style,
							className: 'upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios ugallery-setting-caption-position',
							values: [
								{value: 'over', label: l10n.panel.over, icon: 'over'},
								{value: 'below', label: l10n.panel.under, icon: 'below'}
							]
						}),
						new fields.Color({
							label: l10n.panel.caption_bg,
							label_style: 'inline',
							spectrum: {
								showAlpha: true,
								showPalette: true,
								palette: Upfront.Views.Theme_Colors.colors.pluck('color').length ? Upfront.Views.Theme_Colors.colors.pluck('color') : ['fff', '000', '0f0'],
								maxSelectionSize: 9,
								localStorageKey: 'spectrum.recent_bgs',
								preferredFormat: 'hex',
								chooseText: l10n.panel.ok,
								showInput: true,
								allowEmpty:true,
								show: function() {
									spectrum = $('.sp-container:visible');
								},
								change: function(color) {
									var rgba = color.toRgbString();
									me.model.set_property('captionUseBackground', !!color.alpha);
									me.model.set_property('captionBackground', rgba, true);
									currentColor = rgba;
								},
								move: function(color) {
									var rgba = color.toRgbString();
									spectrum.find('.sp-dragger').css('border-top-color', rgba);
									spectrum.parent().find('.sp-dragger').css('border-right-color', rgba);
									me.parent_view.for_view.$el.find('.ugallery-thumb-title').css('background-color', rgba);
								},
								hide: function(){
									me.parent_view.for_view.$el.find('.ugallery-thumb-title').css('background-color', currentColor);
								}
							}
						})
					]
				})
			]);

			this.on('rendered', function(){
				var help = $('<span class="upfront-field-info" title="' + l10n.panel.adds_sortable + '"></span>');

				this.$('.ugallery-setting-labels').find('.upfront-field-multiple').append(help);

				setTimeout(function(){
					me.toggleCaption();
				}, 100);

				$(me.$('.ugallery-thumbnail-fields')
					.find('.upfront-field-wrap-number')
					.get(0))
					.after('<div class="ugallery-proportional"></div>')
				;

				me.setEvents([
					//['click', '.ugallery-proportional', 'lockProportions'],
					['change', 'input[name=no_padding]', 'on_no_padding_change'],
					['change', 'input[name=thumbWidth]', 'onThumbChangeSize'],
					['change', 'input[name=thumbProportions]', 'onThumbChangeProportions']
				]);
			});

			this.$el.on('change', 'input[name=captionWhen]', function(){
				me.toggleCaption();
			});
		},

		toggleCaption: function(){
			var when = this.$('input[name=captionWhen]:checked').val();
			if(when === 'never'){
				this.$('.ugallery-setting-caption-position').hide();
				this.$('.upfront-field-wrap-color').hide();
			}
			else {
				this.$('.ugallery-setting-caption-position').show();
				this.$('.upfront-field-wrap-color').show();
			}
			var settings = $('#settings');
			settings.height(settings.find('.upfront-settings_panel:visible').outerHeight());
		},
		get_label: function () {
			return 'Layout';
		},
		get_title: function () {
			return false;
		},

		setEvents: function(events){
			var me = this;
			_.each(events, function(event){
				me.$el.on(event[0], event[1], function(e){
					me[event[2]](e);
				});
			});
		},

		on_no_padding_change: function(event) {
			this.property('no_padding', [$(event.target).is(':checked') + '']);
			this.model.trigger('no_padding_change');
		},

		onThumbChangeSize: function(e){
			var factor = this.property('thumbProportions'),
				width = $(e.target).val(),
				height = Math.round($(e.target).val() / factor);

			if(factor === 'theme') {
				factor = 1;
			}
			this.$('input[name=thumbHeight]').val(height);

			this.property('thumbWidth', width);
			this.property('thumbHeight', height, false);

			this.model.trigger('thumbChange');

			return height;
		},

		onThumbChangeProportions: function(e) {
			var factor = $(e.target).val(),
				input = this.$('input[name=thumbWidth]'),
				width = input.val();

			if(factor === 'theme') {
				factor = 1;
			}

			this.property('thumbProportions', factor);
			var height = this.onThumbChangeSize({target: input[0]});

			this.$('input[name=thumbWidth]')
				.siblings('.upfront-field-slider-value')
					.text('(' + width +'px x ' + height + 'px)')
			;

			this.model.trigger('thumbChange');
		},

		/*
		Shorcut to set and get model's properties.
		*/
		property: function(name, value, silent) {
			if(typeof value !== 'undefined'){
				if(typeof silent === 'undefined') {
					silent = true;
				}
				return this.model.set_property(name, value, silent);
			}
			return this.model.get_property_value_by_name(name);
		}
	});

	return LayoutPanel;
});
})(jQuery);
