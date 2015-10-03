define([
	'scripts/upfront/settings/modules/typography',
	'scripts/upfront/settings/modules/border',
	'scripts/upfront/settings/modules/hov-animation',
	'scripts/upfront/settings/modules/radius',
	'scripts/upfront/settings/modules/selectbox',
	'scripts/upfront/settings/modules/caption-location',
	'scripts/upfront/settings/modules/gallery-caption-location',
	'scripts/upfront/settings/modules/colors',
	'scripts/upfront/settings/modules/padding',
	'scripts/upfront/settings/modules/anchor',
	'scripts/upfront/settings/modules/menu-structure',
	'elements/upfront-newnavigation/js/settings/menu-style',
], function(TypographySettingsModule, BorderSettingsModule, HovAnimationSettingsModule, RadiusSettingsModule,
			SelectboxSettingsModule, CaptionLocationSettingsModule, GalleryCaptionLocationSettingsModule,
			ColorsSettingsModule, PaddingSettingsModule, AnchorSettingsModule, MenuStructureModule, MenuStyleModule) {
	var ModuleFactory = function() {
		var classes = {
			'Typography': TypographySettingsModule,
			'Border': BorderSettingsModule,
			'HovAnimation': HovAnimationSettingsModule,
			'Radius': RadiusSettingsModule,
			'Selectbox': SelectboxSettingsModule,
			'CaptionLocation': CaptionLocationSettingsModule,
			'GalleryCaptionLocation': GalleryCaptionLocationSettingsModule,
			'Colors': ColorsSettingsModule,
			'Padding': PaddingSettingsModule,
			'Anchor': AnchorSettingsModule,
			'MenuStructure': MenuStructureModule,
			'MenuStyle': MenuStyleModule
		};

		this.createModule = function(module, options, model) {
			var initializationOptions = _.extend({}, options, { model: model });
			if (typeof module === 'string') {
				return new classes[module](initializationOptions);
			}

			return new module(initializationOptions);
		};
	};

	moduleFactory = new ModuleFactory();

	return moduleFactory;
});
