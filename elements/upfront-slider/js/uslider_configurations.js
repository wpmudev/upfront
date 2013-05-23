// Slider module settings. This drives the Settings options. 
var module_slider_styles = {
	'right': 	{ label: uslider_i18n['settings-style-right'] },
	'group': 	{ label: uslider_i18n['settings-style-group'] },
	'tabbed': 	{ label: uslider_i18n['settings-style-tabbed'] },
	 'text': 	{ label: uslider_i18n['settings-style-text'] }
};

// Note the first level right, group, tabbed, text match the key for the module_slider_styles group!
var module_slider_layouts = {
	'right': {
		'right': 		{ label: uslider_i18n['settings-style-right-right'] },
		'left': 		{ label: uslider_i18n['settings-style-right-left'] },
		'bottom': 		{ label: uslider_i18n['settings-style-right-bottom'] },
		'split': 		{ label: uslider_i18n['settings-style-right-split'] },
		'over': 		{ label: uslider_i18n['settings-style-right-over'] }
	}, 
	'group': {
		'block': 		{ label: uslider_i18n['settings-style-group-block'] },
		'individual': 	{ label: uslider_i18n['settings-style-group-individual'] }
	},
	'tabbed': {
		'right': 		{ label: uslider_i18n['settings-style-tabbed-right'] },
		'left': 		{ label: uslider_i18n['settings-style-tabbed-left'] },
		'under': 		{ label: uslider_i18n['settings-style-tabbed-under'] },
		'split': 		{ label: uslider_i18n['settings-style-tabbed-split'] },
		'over': 		{ label: uslider_i18n['settings-style-tabbed-over'] }
	},
	'text': {
		'text':  		{ label: uslider_i18n['settings-style-text-text'] }
	}
};


var module_slider_transitions = {
	'scrollLeft': 	{ label: uslider_i18n['settings-interactions-transition-scrollLeft'] },
	'scrollRight': 	{ label: uslider_i18n['settings-interactions-transition-scrollRight'] },
	'scrollDown': 	{ label: uslider_i18n['settings-interactions-transition-scrollDown'] },
	'scrollUp': 	{ label: uslider_i18n['settings-interactions-transition-scrollUp'] },
	'shuffle': 		{ label: uslider_i18n['settings-interactions-transition-shuffle'] },
	'fade': 		{ label: uslider_i18n['settings-interactions-transition-fade'] }
};

var module_slider_controls_type	= {
	'arrows-simple': 	{ label: uslider_i18n['settings-components-transition-controls-type-arrows-simple'] },
	'dots': 			{ label: uslider_i18n['settings-components-transition-controls-type-dots'] },
	'thumbnails': 		{ label: uslider_i18n['settings-components-transition-controls-type-thumbnails'] },
	'arrows-stacked': 	{ label: uslider_i18n['settings-components-transition-controls-type-arrows-stacked'] },
	'none': 			{ label: uslider_i18n['settings-components-transition-controls-type-none'] }
};

// Note the first level arrows-simple, dots, thumbnails, arrows-stacked, none match the key for the module_slider_controls_type group!
var module_slider_controls_position = {
	'arrows-simple': 	{
		'inside': 		{ label: uslider_i18n['settings-components-transition-controls-position-arrows-simple-inside'] },
		'outside': 		{ label: uslider_i18n['settings-components-transition-controls-position-arrows-simple-outside'] }
	}, 
	'dots': 			{
		'bottom-out':  	{ label: uslider_i18n['settings-components-transition-controls-position-dots-bottom-outside'] },
		'bottom-in':  	{ label: uslider_i18n['settings-components-transition-controls-position-dots-bottom-inside'] },
		'top-out':  	{ label: uslider_i18n['settings-components-transition-controls-position-dots-top-outside'] },
		'top-in':  		{ label: uslider_i18n['settings-components-transition-controls-position-dots-top-inside'] },
		'left-out':  	{ label: uslider_i18n['settings-components-transition-controls-position-dots-left-outside'] },
		'left-in':		{ label: uslider_i18n['settings-components-transition-controls-position-dots-left-inside'] },
		'right-out': 	{ label: uslider_i18n['settings-components-transition-controls-position-dots-right-outside'] },
		'right-in': 	{ label: uslider_i18n['settings-components-transition-controls-position-dots-right-inside'] }
	},
	'thumbnails': 		{
		'bottom': 		{ label: uslider_i18n['settings-components-transition-controls-position-thumbnails-bottom'] },
		'left': 		{ label: uslider_i18n['settings-components-transition-controls-position-thumbnails-left'] },
		'right': 		{ label: uslider_i18n['settings-components-transition-controls-position-thumbnails-right'] },
		'top': 			{ label: uslider_i18n['settings-components-transition-controls-position-thumbnails-top'] }
	},
	'arrows-stacked': 	{
		'left-top': 	{ label: uslider_i18n['settings-components-transition-controls-position-arrows-stacked-left-top'] },
		'left-bottom': 	{ label: uslider_i18n['settings-components-transition-controls-position-arrows-stacked-left-bottom'] },
		'right-top': 	{ label: uslider_i18n['settings-components-transition-controls-position-arrows-stacked-right-top'] },
		'right-bottom': { label: uslider_i18n['settings-components-transition-controls-position-arrows-stacked-right-bottom'] },
		'top-left': 	{ label: uslider_i18n['settings-components-transition-controls-position-arrows-stacked-top-left'] },
		'top-right': 	{ label: uslider_i18n['settings-components-transition-controls-position-arrows-stacked-top-right'] },
		'bottom-left': 	{ label: uslider_i18n['settings-components-transition-controls-position-arrows-stacked-bottom-left'] },
		'bottom-right': { label: uslider_i18n['settings-components-transition-controls-position-arrows-stacked-bottom-right'] }
	},
	'none': 			{
		'none': 		{ label: uslider_i18n['settings-components-transition-controls-position-none'] }
	}
};
