define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/element-settings/root-settings-panel',
	'scripts/upfront/preset-settings/util',
	'text!elements/upfront-slider/tpl/preset-style.html'
], function(ElementSettings, RootSettingsPanel, Util, styleTpl) {
	var l10n = Upfront.Settings.l10n.slider_element;

	var AppearancePanelConfig = {
		mainDataCollection: 'sliderPresets',
		styleElementPrefix: 'slider-preset',
		ajaxActionSlug: 'slider',
		panelTitle: l10n.settings,
		presetDefaults: Upfront.mainData.presetDefaults.slider,
		styleTpl: styleTpl,
		stateModules: {
			Global: [
				{
					moduleType: 'Selectbox',
					options: {
						state: 'global',
						default_value: 'notext',
						title: l10n.slider_styles,
						custom_class: 'slide_style',
						label: l10n.image_caption_position,
						fields: {
							name: 'primaryStyle'
						},
						values: [
							{ label: l10n.notxt, value: 'notext', icon: 'nocaption' },
							{ label: l10n.txtb, value: 'below', icon: 'below' },
							{ label: l10n.txto, value: 'over', icon: 'bottomOver' },
							{ label: l10n.txts, value: 'side', icon: 'right' }
						]
					}
				},
				{
					moduleType: 'Colors',
					options: {
						title: 'Colors',
						multiple: false,
						single: true,
						abccolors: [
							{
								name: 'captionBackground',
								label: l10n.caption_bg
							},
						]
					}
				},
			]
		},
		migratePresetProperties: function(newPreset) {
			var props = {};

			this.model.get('properties').each( function(prop) {
				props[prop.get('name')] = prop.get('value');
			});

			newPreset.set({
				'captionBackground': props.captionBackground,
				'primaryStyle' : props.primaryStyle
			});
		}
	};

	var LayoutPanel =  RootSettingsPanel.extend({
		className: 'uf-settings-panel upfront-settings_panel upfront-settings_panel_wrap uslider-settings',
		settings: [
			{
				type: 'SettingsItem',
				triggerChange: true,
				title: l10n.slider_behaviour,
				group: true,
				className: 'general_settings_item uslider-rotate-settings',
				fields: [
					{
						type: 'Checkboxes',
						property: 'rotate',
						layout: 'horizontal-inline',
						className: 'rotate',
						multiple: true,
						default_value: 0,
						values: [ { label: l10n.rotate_every, value: 'true' } ],
						change: function(value, parent) {
							if(value[0] === 'true') {
								parent.$el.find('.rotate-time').css('opacity', '1');
							} else {
								parent.$el.find('.rotate-time').css('opacity', '0.5');
							}
						},
					},
					{
						type: 'Number',
						className: 'rotate-time',
						property: 'rotateTime',
						min: 1,
						max: 60,
						step: 1,
						suffix: 'sec.'
					},
					{
						type: 'Select',
						property: 'transition',
						label: l10n.slider_transition,
						layout: 'horizontal-inline',
						icon_class: 'upfront-region-field-icon',
						className: 'uslider-transition-setting rotate-effect',
						default_value: 'crossfade',
						values: [
							{ label: l10n.slide_down, value: 'slide-down', icon: 'bg-slider-slide-down' },
							{ label: l10n.slide_up, value: 'slide-up', icon: 'bg-slider-slide-up' },
							{ label: l10n.slide_right, value: 'slide-right', icon: 'bg-slider-slide-right' },
							{ label: l10n.slide_left, value: 'slide-left', icon: 'bg-slider-slide-left' },
							{ label: l10n.crossfade, value: 'crossfade', icon: 'bg-slider-crossfade' }
						]
					}
				]
			},
			{
				type: 'SettingsItem',
				triggerChange: true,
				title: l10n.slider_controls,
				className: 'general_settings_item',
				fields: [
					{
						type: 'Select',
						label: l10n.slider_controls_style,
						className: 'slider-contrls-style',
						property: 'controls',
						default_value: 'arrows',
						values: [
							{label: l10n.dots, value: 'dots'},
							{label: l10n.arrows, value: 'arrows'},
							{label: l10n.both, value: 'both'}
						]
					},
					{
						type: 'Radios',
						property: 'controlsWhen',
						layout: 'horizontal-inline',
						default_value: 'hover',
						className: 'uslider-controlswhen-setting upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios',
						values: [
							{ label: l10n.on_hover, value: 'hover' },
							{ label: l10n.always, value: 'always' }
						]
					}
				]
			}
		],

		initialize: function(options) {
			this.constructor.__super__.initialize.call(this, options);

			this.on('rendered', function(){
				me.toggleColorSetting();
				var spectrum = false,
					currentColor = me.model.get_property_value_by_name('captionBackground'),
					// input = $('<input type="text" value="' + currentColor + '">'),
					$picker_place = $("<span></span>");
					setting = me.$('.ugallery-colorpicker-setting')
				;

				// setting.find('.upfront-field-wrap').append(input);
				setting.find('.upfront-field-wrap').append($picker_place);
				setting.find('input[name="captionUseBackground"]').on('change', function(){
					me.toggleColorPicker();
				});

				var color_picker = new Upfront.Views.Editor.Field.Color({
							blank_alpha : 0,
							model: me.model,
							property: 'captionBackground',
							default_value: '#ffffff',
							spectrum: {
								maxSelectionSize: 9,
								localStorageKey: "spectrum.recent_bgs",
								preferredFormat: "hex",
								chooseText: l10n.ok,
								showInput: true,
									allowEmpty:true,
									show: function(){
									spectrum = $('.sp-container:visible');
									},
								change: function(color) {
									var rgba = color.toRgbString();
									me.model.set_property('captionBackground', rgba, true);
									currentColor = rgba;
									me.model.trigger('background', rgba);
								},
								move: function(color) {
									var rgba = color.toRgbString();
									spectrum.find('.sp-dragger').css('border-top-color', rgba);
									spectrum.parent().find('.sp-dragger').css('border-right-color', rgba);
									me.parent_view.for_view.$el.find('.uslide-caption').css('background-color', rgba);
								},
								hide: function(){
									me.parent_view.for_view.$el.find('.uslide-caption').css('background-color', currentColor);
								}
							}
					});
				color_picker.render();
				$picker_place.html(color_picker.el);
				setting.find('.sp-replacer').css('display', 'inline-block');
				me.toggleColorPicker();
			});

			this.$el.on('change', 'input[name="primaryStyle"]', function(e){
				me.toggleColorSetting();
			});
		},

		toggleColorSetting: function(){
			var style = this.$('.uslider-style-setting').find('input:checked').val();
			if(style == 'notext')
				this.$('.ugallery-colorpicker-setting').hide();
			else
				this.$('.ugallery-colorpicker-setting').show();
		},

		toggleColorPicker: function(){
			var setting = this.$('.ugallery-colorpicker-setting'),
				color = setting.find('input:checked').val(),
				picker = setting.find('.sp-replacer')
			;
			if(color == "1"){
				picker.show();
			}
			else{
				picker.hide();
			}
		},

		title: l10n.general
	});


	var SlidesPanel =  RootSettingsPanel.extend({
		className: 'uf-settings-panel upfront-settings_panel upfront-settings_panel_wrap uslider-slides',
		settings: [
			{
				type: 'SettingsItem',
				group: false,
				fields: [
					{
						type: 'SlidesField'
					}
				]
			}
		],
		title: l10n.slides_order
	});

	var SliderSettings = ElementSettings.extend({
		panels: {
			Layout: LayoutPanel,
			Slides: SlidesPanel,
			Appearance: AppearancePanelConfig
		},
		title: l10n.settings
	});

	// Generate presets styles to page
	Util.generatePresetsToPage('slider', styleTpl);

	return SliderSettings;
});
