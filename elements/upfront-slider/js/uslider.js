// See uslide_configurations.js for options/setup and I18N. 
(function ($) {

//Slide Model
var Uslider_Slide = Backbone.Model.extend({
	defaults: {
		images: [],
		title: '',
		description: '',
		link: false
	}
});

//Slide Collection
var Uslider_Slides = Backbone.Collection.extend({
	model: Uslider_Slide
});

/**
 * Define the model - initialize properties to their default values.
 * @type {Upfront.Models.ObjectModel}
 */
var USliderModel = Upfront.Models.ObjectModel.extend({
	/**
	 * A quasi-constructor, called after actual constructor *and* the built-in `initialize()` method.
	 * Used for setting up instance defaults, initialization and the like.
	 */
	init: function () {
		this.init_properties({
			type: 'USliderModel',
			view_class: 'USliderView',
			element_id: Upfront.Util.get_unique_id("uslider-object"),
			'class': "c22 upfront-uslider",
			has_settings: 1,

			uslider_content: {order:[], slides:{}},
			slide_style: 'right',
			slide_text: 'no',
			slide_layout: 'right',
			slide_behaviour: {
				autoStart: true,
				hover: true,
				interval: 5,
				speed: 1
			},
			slide_transition: 'scrollLeft',
			controls_type: 'arrows-simple',
			controls_position: 'inside',
			slides: []
		});
	}
});

/**
 * View instance - what the element looks like.
 * @type {Upfront.Views.ObjectView}
 */
var USliderView = Upfront.Views.ObjectView.extend({
	self: {},
	module_settings: {},
	template: _.template($('#uslider-template').html()),

	get_content_markup: function () {
		var sliderOptions = {},
			settings = {
				style: this.property_value('slide_style'),
				desc_text: this.property_value('slide_text'),
				layout: this.property_value('slide_layout'),
				controls_type: this.property_value('controls_type'),
				controls_position: this.property_value('controls_position'),
			},
			behaviour = this.property_value('slide_behaviour'),
			controls = settings['controls_type'],
			pagerAnchorBuilder = null,
			tplOptions = {},
			slides = this.property_value('uslider_content')
		;

		//Page anchor builder
		if(controls == 'dots'){
			pagerAnchorBuilder = function(idx, slide) { return '<li><a href="#">' + idx + '</a></li>' }
		}
		if(controls == 'thumbnails'){
			pagerAnchorBuilder = function(idx, slide) { 
				return '<li><a href="#">' + idx + '</a></li>';
			}
		}

		sliderOptions = {
			fx: behaviour['transition'],
			timeout: behaviour['interval'] * 1000,
			speed: behaviour['speed'] * 1000,
			pause: behaviour['hover'] == "on",
			//prev: controls.indexOf('arrows') == 0 ? '#' + element_id + ' a.uslider-control-prev' : null,
			//next: controls.indexOf('arrows') == 0 ? '#' + element_id + ' a.uslider-control-next' : null,
			//pager: ['dots', 'thumbnails'].indexOf(controls) != -1 ? '#' + element_id + ' ul.uslider-pager' : null,
			//pagerAnchorBuilder: pagerAnchorBuilder,
			fit: true,
			width: '400px',
			height: '400px'
		}

		tplSettings = {
			sliderOptions: sliderOptions,
			settings: settings,
			content: slides,
			slidesLength: slides.order.length,
			i:0,
			sliderId: this.model.get_property_value_by_name('element_id'),
			selector: '#' + this.model.get_property_value_by_name('element_id') + ' div.uslider-slides',
			sliderClasses: ''
		}
		return this.template(tplSettings);
	},
	property_value: function(name){
		return this.model.get_property_value_by_name(name);
	},
	get_container_classes: function() {
		var container_classes = '';
		container_classes += 'uslider-container-style-'+this.property_value('slide_style')+' ';
		container_classes += 'uslider-container-layout-'+this.property_value('slide_layout');
		container_classes += 'uslider-container-controls-type-'+this.property_value('controls_type');
		container_classes += 'uslider-container-controls-position-'+this.property_value('controls_position');

		return container_classes;
	},
	html_to_server_debug: function(slides_html, slides_js) {
		var post = jQuery.ajax({
			type: "POST",
			url: wp.media.model.settings.ajaxurl,
			async: false,
			dataType: "json",
			cache: false,
			data: {  
		    	'action': 'UpFrontSlider',
				'function': 'test_slides',
				'slides_html': slides_html,
				'slides_js': slides_js
			},
			success: function(reply_data) {
				//console.log('debug output saved');
			}
		});
	},
	isLocalURL: function(anchor_href) {
		var regExp = new RegExp("//" + location.host + "($|/)");
	    return (anchor_href.substring(0,4) === "http") ? regExp.test(anchor_href) : true;		
	}
});


/***********************************************************************************************************************************************
* Panel for Layout
/**********************************************************************************************************************************************/
var USliderSettingsPanel_Layout = Upfront.Views.Editor.Settings.Panel.extend({
	/**
	 * Initialize the view, and populate the internal 
	 * setting items array with Item instances.
	 */
	initialize: function () {
		this.settings = _([
			new USliderSettingsSlideStyle({model: this.model}),
			new USliderSettingsSlideDescription({model: this.model}),
			new USliderSettingsSlideLayout({model: this.model}),
		]);
	},
	/**
	 * Get the label (what will be shown in the settings overview)
	 * @return {string} Label.
	 */
	get_label: function () {
		return uslider_i18n['settings-layout-menu'];
	},
});

var USliderSettingsSlideStyle = Upfront.Views.Editor.Settings.Item.extend({
	events: {
		'click input[type="radio"]': 'process_style_selection'		
	},
	setting_options_styles: module_slider_styles, 
	
	/**
	 * Set up setting item appearance.
	 */
	render: function () {
		
		var style_option_idx = this.model.get_property_value_by_name("slide_style");
		style_option_idx = this.get_settings_defaults(style_option_idx);
		
		uslider_settings_html = '';

		uslider_settings_html += '<ul class="uslider-styles-options">';

			for (var option_idx in this.setting_options_styles) {
				var checked_text = '';
				// If we don't have a value then just set it to the first item. 
				if (style_option_idx == false) style_option_idx = option_idx;
				
				if (style_option_idx == option_idx) {
					checked_text = ' checked="checked" ';
				}
				uslider_settings_html += '<li id="uslider-slider-style-'+option_idx+'"><input type="radio" '+checked_text+' id="uslider-slider-style-option-'+option_idx+'" name="uslider-slider[style]" value="'+option_idx+'" /> <label for="uslider-slider-style-'+option_idx+'">'+this.setting_options_styles[option_idx]['label']+'</label>';
			}
		uslider_settings_html += '</ul>';
		
		// Wrap method accepts an object, with defined "title" and "markup" properties.
		// The "markup" one holds the actual Item markup.
		this.wrap({
			"title": uslider_i18n['settings-layout-style-header'], 
			"markup": uslider_settings_html
		});
	},
	process_style_selection: function(e) {
		var el = $(e.target);
		
		var style_value = $(el).val();
		this.show_layout_options($(el).val());
	},
	show_layout_options: function(option_idx) {

		if (option_idx == "text") {
			// Technically we should hide the 'Slider Descrption Text' section. 				
			$('input#uslider-slider-desc-text').parents('li div.upfront-settings-item').hide();
		} else {
			$('input#uslider-slider-desc-text').parents('li div.upfront-settings-item').show();
		}
		$("div.uslider-slider-style-layouts").hide();
		$("div#uslider-slider-style-layouts-"+option_idx).show();
	},
	/**
	 * Defines under which Property name the value will be saved.
	 * @return {string} Property name
	 */
	get_name: function () {
		return "slide_style";
	},
	/**
	 * Extracts the finalized value from the setting markup.
	 * @return {mixed} Value.
	 */
	get_value: function () {
		var style_option_idx = this.$el.find(':radio[name="uslider-slider[style]"]:checked').val();
		style_option_idx = this.get_settings_defaults(style_option_idx);
		//console.log('get_value: style['+style_option_idx+']');	

		return style_option_idx;
	},
	get_settings_defaults: function(module_settings) {
		var _first_option = false;
		for (var option_idx in this.setting_options_styles) {

			// Grab our first option for later. 
			 if (_first_option == false)
				_first_option = option_idx;
				
			// If we don't have a value then just set it to the first item. 
			if (module_settings == false) {
				return option_idx;
			} else if (module_settings == option_idx) {
				return option_idx;				
			}			
		}
		
		// If here we didn't find a match. so return our _first_option value
		return _first_option;
	}
});

var USliderSettingsSlideDescription = Upfront.Views.Editor.Settings.Item.extend({

	/**
	 * Set up setting item appearance.
	 */
	render: function () {
		
		var module_settings = this.model.get_property_value_by_name("slide_text");
		module_settings = this.get_settings_defaults(module_settings);
		
		uslider_settings_html = '';

		if (module_settings == 'no') {
			checked_text = ' checked="checked" ';
		} else {
			var checked_text = '';
		}
		
		uslider_settings_html += '<input type="checkbox" '+checked_text+' id="uslider-slider-desc-text" value="no" name="uslider-slider[desc-text]" /> <label for="uslider-slider-desc-text">'+uslider_i18n['settings-layout-desc-label']+'</label>';

			
		// Wrap method accepts an object, with defined "title" and "markup" properties.
		// The "markup" one holds the actual Item markup.
		this.wrap({
			"title": uslider_i18n['settings-layout-desc-header'], 
			"markup": uslider_settings_html
		});
	},
	/**
	 * Defines under which Property name the value will be saved.
	 * @return {string} Property name
	 */
	get_name: function () {
		return "slide_text";
	},
	/**
	 * Extracts the finalized value from the setting markup.
	 * @return {mixed} Value.
	 */
	get_value: function () {
		var module_settings = {};
		
		module_settings = this.$el.find(':checkbox[name="uslider-slider[desc-text]"]:checked').val();
		if ((module_settings == undefined) || (module_settings == ''))
			module_settings = "yes";
		//console.log('render: module_settings[desc-text]['+module_settings+']');	

		return module_settings;
	},
	get_settings_defaults: function(module_settings) {
		if (module_settings == false) 
			module_settings = '';
		
		if ((module_settings != '') && (module_settings != 'yes'))
			module_settings = '';

		return 	module_settings;
	}
});

var USliderSettingsSlideLayout = Upfront.Views.Editor.Settings.Item.extend({
	setting_options_layouts: module_slider_layouts,
	setting_options_styles: module_slider_styles, 

	/**
	 * Set up setting item appearance.
	 */
	render: function () {
		var module_settings = {};
		
		module_settings['style_idx'] = this.model.get_property_value_by_name("slide_style");		
		module_settings['style_idx'] = 'xxx';
		module_settings['layout_idx'] = this.model.get_property_value_by_name("slide_layout");
		current_layout_option_idx = this.get_settings_defaults(module_settings);

		//console.log('style_idx=['+module_settings['style_idx']+']');
		//console.log('layout_idx=['+module_settings['layout_idx']+']');
		
		

		uslider_settings_html = '';

		for (var layout_idx in this.setting_options_layouts) {
			var layout_style = ' style="display:none;" ';
			var layout_class = '';

			var layout_options = this.setting_options_layouts[layout_idx];
			
			if (layout_idx == module_settings['style_idx']) {
				layout_style = '';
				layout_class = ' uslider-style-current ';
			}

			uslider_settings_html += '<div id="uslider-slider-style-layouts-'+layout_idx+'" class="uslider-slider-style-layouts '+layout_class+'" '+layout_style+'><ul>';
			
				for (var layout_section_idx in layout_options) {
					var checked_text = '';
					if (layout_section_idx == module_settings['layout_idx']) {
						checked_text = ' checked="checked" ';
					}
					uslider_settings_html += '<li><input type="radio" '+checked_text+' id="uslider-slider-layout-'+layout_section_idx+'" name="uslider-slider[layout]['+layout_idx+']" value="'+layout_section_idx+'" /> <label for="uslider-slider-layout-'+layout_section_idx+'">'+this.setting_options_layouts[layout_idx][layout_section_idx]['label']+'</label>';
				}
			
			uslider_settings_html += '</ul></div>';
		}
	
		// Wrap method accepts an object, with defined "title" and "markup" properties.
		// The "markup" one holds the actual Item markup.
		this.wrap({
			"title": uslider_i18n['settings-layout-layout-header'],
			"markup": uslider_settings_html
		});		
	},
	/**
	 * Defines under which Property name the value will be saved.
	 * @return {string} Property name
	 */
	get_name: function () {
		return "slide_layout";
	},
	/**
	 * Extracts the finalized value from the setting markup.
	 * @return {mixed} Value.
	 */
	get_value: function () {
		var layout_option_idx = false;
		
		var style_option_idx = this.model.get_property_value_by_name("slide_style");		
		if (style_option_idx != false) {
			var layout_option_idx = this.$el.find(':radio[name="uslider-slider[layout]['+style_option_idx+']"]:checked').val();
			if ((layout_option_idx == undefined) || (layout_option_idx == '')) {
				layout_option_idx = false;
			}
		} 
		//console.log('get_value: layout=['+layout_option_idx+']');	

		return layout_option_idx;
	},
	get_settings_defaults: function(module_settings) {

		// Total kludge here. Need a better way to access the options from the style model. Seems dirty. Should be able to call the get_settings_defaults for the style model. 
		var _first_option_style = false;
		for (var option_idx in this.setting_options_styles) {

			// Grab our first option for later. 
			 if (_first_option_style == false)
				_first_option_style = option_idx;
				
			// If we don't have a value then just set it to the first item. 
			if (module_settings['style_idx'] == false) {
				module_settings['style_idx'] = option_idx;
				break;
			} else if (module_settings['style_idx'] == option_idx) {
				break;
			}			
		}
		if (option_idx != module_settings['style_idx']) {
			module_settings['style_idx'] = _first_option_style;
		}

		var _first_option_layout = false;
		for (var option_idx in this.setting_options_styles) {

			// Grab our first option for later. 
			 if (_first_option_layout == false)
				_first_option_layout = option_idx;
				
			// If we don't have a value then just set it to the first item. 
			if (module_settings['layout_idx'] == false) {
				module_settings['layout_idx'] = option_idx;
				break;
			} else if (module_settings['layout_idx'] == option_idx) {
				break;
			}			
		}
		if (option_idx != module_settings['layout_idx']) {
			module_settings['layout_idx'] = _first_option_layout;
		}

		return module_settings;
	}
	
});


/***********************************************************************************************************************************************
* Panel for Interactions
/**********************************************************************************************************************************************/
/**
 * Interaction settings panel.
 * @type {Upfront.Views.Editor.Settings.Panel}
 */
var USliderSettingsPanel_Interaction = Upfront.Views.Editor.Settings.Panel.extend({
	/**
	 * Initialize the view, and populate the internal 
	 * setting items array with Item instances.
	 */
	initialize: function () {
		this.settings = _([
			new USliderSettingsSlideBehaviour({model: this.model}),
			new USliderSettingsSlideTransition({model: this.model}),
		]);
	},
	/**
	 * Get the label (what will be shown in the settings overview)
	 * @return {string} Label.
	 */
	get_label: function () {
		//return "Interaction";
		return uslider_i18n['settings-interaction-menu'];
	},
	/**
	 * Get the title (goes into settings title area)
	 * @return {string} Title
	 */
//	get_title: function () {
//		return "Interation options";
//	}
});

var USliderSettingsSlideBehaviour = Upfront.Views.Editor.Settings.Item.extend({
	/**
	 * Set up setting item appearance.
	 */
	render: function () {
		
		var module_settings = this.model.get_property_value_by_name("slide_behaviour");
		module_settings = this.get_settings_defaults(module_settings);

		uslider_settings_html = '';

		if (module_settings['auto-start'] == 'yes')
			var checked_text = ' checked="checked" ';
		else
		var checked_text = '';
		
		uslider_settings_html += '<p><input type="checkbox" '+checked_text+' name="uslider-setting[interactions][auto-start]" value="true" id="uslider-setting-interactions-auto-start" /> <label for="uslider-setting-interactions-auto-start">'+uslider_i18n['setting-interactions-auto-start']+'</label></p>';


		if (module_settings['hover'] == 'yes')
			var checked_text = ' checked="checked" ';
		else
			var checked_text = '';
		uslider_settings_html += '<p><input type="checkbox" '+checked_text+' name="uslider-setting[interactions][hover]" id="uslider-setting-interactions-hover" /> <label for="uslider-setting-interactions-hover">'+uslider_i18n['setting-interactions-hover']+'</label></p>';

		uslider_settings_html += '<p><input size="2" type="text" name="uslider-setting[interactions][interval]" value="'+module_settings['interval']+'" id="uslider-setting-interactions-interval" /> <label for="uslider-setting-interactions-interval">'+uslider_i18n['setting-interactions-interval']+'</label></p>';
		uslider_settings_html += '<p><input size="2" type="text" name="uslider-setting[interactions][speed]" value="'+module_settings['speed']+'" id="uslider-setting-interactions-speed" /> <label for="uslider-setting-interactions-speed">'+uslider_i18n['setting-interactions-speed']+'</label></p>';
		

		// Wrap method accepts an object, with defined "title" and "markup" properties.
		// The "markup" one holds the actual Item markup.
		this.wrap({
			"title": uslider_i18n['settings-interactions-behaviour-header'], 
			"markup": uslider_settings_html
		});
	},
	/**
	 * Defines under which Property name the value will be saved.
	 * @return {string} Property name
	 */
	get_name: function () {
		return "slide_behaviour";
	},
	/**
	 * Extracts the finalized value from the setting markup.
	 * @return {mixed} Value.
	 */
	get_value: function () {
		var module_settings = {};
		
		module_settings['auto-start'] 	= this.$el.find(':checkbox[name="uslider-setting[interactions][auto-start]"]:checked').val();
		module_settings['hover'] 		= this.$el.find(':checkbox[name="uslider-setting[interactions][hover]"]:checked').val();
		module_settings['interval'] 	= this.$el.find(':text[name="uslider-setting[interactions][interval]"]').val();
		module_settings['speed'] 		= this.$el.find(':text[name="uslider-setting[interactions][speed]"]').val();
		
		module_settings = this.get_settings_defaults(module_settings);
		return module_settings;
	},
	get_settings_defaults: function(module_settings) {
		if (module_settings == false)
			module_settings = {};

		if ((module_settings['auto-start'] == undefined) || (module_settings['auto-start'] == ''))
			module_settings['auto-start'] = "yes";
		
		if ((module_settings['hover'] == undefined) || (module_settings['hover'] == ''))
			module_settings['hover'] = "yes";
		
		if ((module_settings['interval'] == undefined) || (module_settings['interval'] == ''))
			module_settings['interval'] = "5";
		
		if ((module_settings['speed'] == undefined) || (module_settings['speed'] == ''))
			module_settings['speed'] = "1";

		return module_settings;
	}
});

var USliderSettingsSlideTransition = Upfront.Views.Editor.Settings.Item.extend({
	setting_options_transitions: module_slider_transitions,
	/**
	 * Set up setting item appearance.
	 */
	render: function () {
		
		var module_settings = this.model.get_property_value_by_name("slide_transition");
		module_settings = this.get_settings_defaults(module_settings);
		//console.log('render: transition=['+module_settings+']');
			
		uslider_settings_html = '';
		uslider_settings_html += '<ul class="uslider-settings-interaction-transition-options">';
		
		for (var transition_idx in this.setting_options_transitions) {
			var checked_text = '';
			if (module_settings == transition_idx) {
				checked_text = ' checked="checked" ';
			}
			uslider_settings_html += '<li><input type="radio" '+checked_text+' id="uslider-settings-interaction-transition-'+transition_idx+'" name="uslider-setting[interactions][transition]" value="'+transition_idx+'" /> <label for="uslider-settings-interaction-transition-'+transition_idx+'">'+this.setting_options_transitions[transition_idx]['label']+'</label>';
		}		
		uslider_settings_html += '</ul>';
		
		// Wrap method accepts an object, with defined "title" and "markup" properties.
		// The "markup" one holds the actual Item markup.
		this.wrap({
			"title": uslider_i18n['settings-interactions-transition-header'], 
			"markup": uslider_settings_html
		});
	},
	/**
	 * Defines under which Property name the value will be saved.
	 * @return {string} Property name
	 */
	get_name: function () {
		return "slide_transition";
	},
	/**
	 * Extracts the finalized value from the setting markup.
	 * @return {mixed} Value.
	 */
	get_value: function () {
		var module_settings = {};
		
		module_settings = this.$el.find(':radio[name="uslider-setting[interactions][transition]"]:checked').val();
		module_settings = this.get_settings_defaults(module_settings);
		//console.log('get_value: transition=['+module_settings+']');
		
		return module_settings;
	},
	get_settings_defaults: function(module_settings) {
		var _first_option = false;
		for (var option_idx in this.setting_options_transitions) {

			// Grab our first option for later. 
			 if (_first_option == false)
				_first_option = option_idx;
				
			// If we don't have a value then just set it to the first item. 
			if (module_settings == false) {
				return option_idx;
			} else if (module_settings['layout_idx'] == option_idx) {
				return option_idx;
			}			
		}
		return _first_option;
	}
});

/***********************************************************************************************************************************************
* Panel for Components
/**********************************************************************************************************************************************/
/**
 * Interaction settings panel.
 * @type {Upfront.Views.Editor.Settings.Panel}
 */
var USliderSettingsPanel_Components = Upfront.Views.Editor.Settings.Panel.extend({
	/**
	 * Initialize the view, and populate the internal 
	 * setting items array with Item instances.
	 */
	initialize: function () {
		this.settings = _([
			new USliderSettingsSlideControllerType({model: this.model}),
			new USliderSettingsSlideControllerPosition({model: this.model}),
		]);
	},
	/**
	 * Get the label (what will be shown in the settings overview)
	 * @return {string} Label.
	 */
	get_label: function () {
		//return "Components";
		return uslider_i18n['settings-components-menu'];
	},
	/**
	 * Get the title (goes into settings title area)
	 * @return {string} Title
	 */
//	get_title: function () {
//		return "Components options";
//	}
});

var USliderSettingsSlideControllerType = Upfront.Views.Editor.Settings.Item.extend({
	events: {
		'click input[type="radio"]': 'show_controller_positions'		
	},
	setting_options_controls_types: module_slider_controls_type,

	/**
	 * Set up setting item appearance.
	 */
	render: function () {
		
		var module_settings = this.model.get_property_value_by_name("controls_type");		
		module_settings = this.get_settings_defaults(module_settings);
		uslider_settings_html = '';
		
		uslider_settings_html += '<ul class="uslider-settings-components-controls-type-options">';
		
		for (var component_idx in this.setting_options_controls_types) {
			var checked_text = '';
			if (module_settings == component_idx) {
				checked_text = ' checked="checked" ';
			}
			uslider_settings_html += '<li><input type="radio" '+checked_text+' id="uslider-settings-components-controls-type-'+component_idx+'" name="uslider-setting[components][controls-type]" value="'+component_idx+'" /> <label for="uslider-settings-components-controls-type-'+component_idx+'">'+this.setting_options_controls_types[component_idx]['label']+'</label>';
		}
		
		uslider_settings_html += '</ul>';

		// Wrap method accepts an object, with defined "title" and "markup" properties.
		// The "markup" one holds the actual Item markup.
		this.wrap({
			"title": uslider_i18n['settings-components-transition-controls-type-header'], 
			"markup": uslider_settings_html
		});
	},
	show_controller_positions: function(e) {
		var el = $(e.target);
		
		var module_slider_controls_type_value = $(el).val();
		//console.log('module_slider_controls_type_value=['+module_slider_controls_type_value+']');

		jQuery("div.uslider-slider-controls-position-options").hide();
		jQuery("div#uslider-slider-controls-position-options-"+module_slider_controls_type_value).show();
		
	},
	/**
	 * Defines under which Property name the value will be saved.
	 * @return {string} Property name
	 */
	get_name: function () {
		return "controls_type";
	},
	/**
	 * Extracts the finalized value from the setting markup.
	 * @return {mixed} Value.
	 */
	get_value: function () {
		var module_settings = {};
		
		module_settings = this.$el.find(':radio[name="uslider-setting[components][controls-type]"]:checked').val();
		module_settings = this.get_settings_defaults(module_settings);
		
		return module_settings;
	},
	get_settings_defaults: function(module_settings) {
		var _first_option = false;
		for (var option_idx in this.setting_options_controls_types) {

			// Grab our first option for later. 
			 if (_first_option == false)
				_first_option = option_idx;
				
			// If we don't have a value then just set it to the first item. 
			if (module_settings == false) {
				return option_idx;
			} else if (module_settings == option_idx) {
				return option_idx;
			}			
		}
		return _first_option;	
	}
});

var USliderSettingsSlideControllerPosition = Upfront.Views.Editor.Settings.Item.extend({
	setting_options_controls_types: module_slider_controls_type,
	setting_options_controls_positions: module_slider_controls_position,
	
	/**
	 * Set up setting item appearance.
	 */
	render: function () {
		var module_settings = {};
		module_settings['controls_type'] 		= this.model.get_property_value_by_name("controls_type");
		module_settings['controls_position']	= this.model.get_property_value_by_name("controls_position");
		module_settings = this.get_settings_defaults(module_settings);
		//console.log('render: controls_type=['+module_settings['controls_type']+']');
		//console.log('render: controls_position=['+module_settings['controls_position']+']');

		uslider_settings_html = '';

		for (var module_slider_controls_position_idx in this.setting_options_controls_types) {

			if (module_slider_controls_position_idx == module_settings['controls_type']) {
				var module_slider_controls_position_style = '';
			} else {
				var module_slider_controls_position_style = ' style="display:none;" ';				
			}

			uslider_settings_html += '<div id="uslider-slider-controls-position-options-'+module_slider_controls_position_idx+'" class="uslider-slider-controls-position-options" '+module_slider_controls_position_style+'>';
			
				uslider_settings_html += '<select name="uslider-setting[components][controls-position]['+module_slider_controls_position_idx+']">';

				for (var module_slider_controls_position_sub_idx in this.setting_options_controls_positions[module_slider_controls_position_idx]) {
					var checked_text = '';
					if (module_settings == module_slider_controls_position_sub_idx) {
						checked_text = ' selected="selected" ';
					}
				
					uslider_settings_html += '<option value="'+module_slider_controls_position_sub_idx+'">'+this.setting_options_controls_positions[module_slider_controls_position_idx][module_slider_controls_position_sub_idx]['label']+'</option>';
				}
				uslider_settings_html += '</select>';
			
			uslider_settings_html += '</div>';
		}

		// Wrap method accepts an object, with defined "title" and "markup" properties.
		// The "markup" one holds the actual Item markup.
		this.wrap({
			"title": uslider_i18n['settings-components-transition-controls-position-header'], 
			"markup": uslider_settings_html
		});
	},
	/**
	 * Defines under which Property name the value will be saved.
	 * @return {string} Property name
	 */
	get_name: function () {
		return "controls_position";
	},
	/**
	 * Extracts the finalized value from the setting markup.
	 * @return {mixed} Value.
	 */
	get_value: function () {
		var module_settings = {};
		
		var module_slider_controls_type 		= this.model.get_property_value_by_name("controls_type");
		if (module_slider_controls_type == "none")
			module_settings = "none";
		else
			module_settings = this.$el.find('select[name="uslider-setting[components][controls-position]['+module_slider_controls_type+']"]').val();
		
		return module_settings;
	},
	get_settings_defaults: function(module_settings) {

		// Total kludge here. Need a better way to access the options from the style model. Seems dirty. Should be able to call the get_settings_defaults for the style model. 
		var _first_option_type = false;
		for (var option_idx in this.setting_options_controls_types) {

			// Grab our first option for later. 
			 if (_first_option_type == false)
				_first_option_type = option_idx;
				
			// If we don't have a value then just set it to the first item. 
			if (module_settings['controls_type'] == false) {
				module_settings['controls_type'] = option_idx;
				break;
			} else if (module_settings['controls_type'] == option_idx) {
				break;
			}			
		}
		if (option_idx != module_settings['controls_type']) {
			module_settings['controls_type'] = _first_option_type;
		}

		if (this.setting_options_controls_positions[module_settings['controls_type']] != undefined) {
			var _first_option_position = false;
			for (var option_idx in this.setting_options_controls_positions[module_settings['controls_type']]) {

				// Grab our first option for later. 
				 if (_first_option_position == false)
					_first_option_position = option_idx;
				
				// If we don't have a value then just set it to the first item. 
				if (module_settings['controls_position'] == false) {
					module_settings['controls_position'] = option_idx;
					break;
				} else if (module_settings['controls_position'] == option_idx) {
					break;
				}			
			}
			if (option_idx != module_settings['controls_position']) {
				module_settings['controls_position'] = _first_option_position;
			}
		}
		return module_settings;
	}
	
});


/***********************************************************************************************************************************************
* Panel for Content/Slides
/**********************************************************************************************************************************************/
var USliderSettingsPanel_Content = Upfront.Views.Editor.Settings.Panel.extend({
	/**
	 * Initialize the view, and populate the internal 
	 * setting items array with Item instances.
	 */
	initialize: function () {
		this.settings = _([
			new UsliderSettings_Contents({model: this.model}),
		]);
	},
	/**
	 * Get the label (what will be shown in the settings overview)
	 * @return {string} Label.
	 */
	get_label: function () {
		return uslider_i18n['settings-content-menu'];
	},
});

var UsliderSlideEditView = Backbone.View.extend({
	template: _.template($('#uslide-editdialog-template').html()),
	initialize: function(options){
		this.slide = options.slide;
		this.render();
	},
	render: function(){
		var imageUrl = '', tplOptions;

		if (slide['sizes']) {
			if (slide['sizes']['thumbnail'])
				imageUrl = slide['sizes']['thumbnail']['url'];
			else if (slide['sizes']['full'])
				imageUrl = slide['sizes']['full']['url'];
		}

		var self = this,
			slide = this.slide,
			tplOptions = {
				dialogTitle: this.slide.id == 'new' ? uslider_i18n['settings-dialog-title-slide-new'] : uslider_i18n['settings-dialog-title-slide-edit'],
				imageUrl: imageUrl,
				originalId: slide.id,
				id: slide.id && slide.id != 'new' ? slide.id : '',
				obj: slide.id && slide.id != 'new' ? JSON.stringify(slide) : '',
				slide: slide,
				changeButtonText: uslider_i18n['settings-content-dialog-change-image-button'],
				removeButtonText: uslider_i18n['settings-content-dialog-remove-image-button'],
				titleLabel: uslider_i18n['settings-content-dialog-title'],
				descriptionLabel: uslider_i18n['settings-content-dialog-description'],
				linkLabel: uslider_i18n['settings-content-dialog-links-to']
			}
		;

		this.$el.html(this.template(tplOptions));
		this.$el.dialog({
			title: tplOptions.dialogTitle,
			height: 400,
			width: 450,
			modal: true,
			buttons: [
				{
					text: uslider_i18n['settings-content-dialog-cancel-button'],
					click: function () { self.on_cancel(); }
				},
				{
					text: uslider_i18n['settings-content-dialog-save-button'],
					click: function () { self.on_save(); }
				}
			]
		})

	},

	on_save: function() {
		var slide = 'hola';
	},

	on_cancel: function() {

	}

});





var UsliderSettings_Contents = Upfront.Views.Editor.Settings.Item.extend({
	template: _.template($('#uslider-contentfield-template').html()),
	initialize: function(attrs){
		this.model = attrs.model;
		this.slides = new Uslider_Slides(this.model.get_property_value_by_name('slides'));

		this.addSlideEvents();
	},
	render: function() {
		var slideTemplateSelector = this.model.get_property_value_by_name('slide_style') == 'text' ? '#uslider-content-textslide-template' : '#uslider-content-imgslide-template';
		this.wrap({
			title: 'Slider contents',
			markup: this.template({
				slides: this.slides,
				slideTemplate: _.template($(slideTemplateSelector).html())
			})
		});
	},
	addSlideEvents: function(){
		this.slides.on('add remove sort reset', this.render, this);
	},
	events: {
		'click a.uslider_content_add' : 'addRequest',
		'click a.uslider_content_edit' : 'editRequest',
		'click a.uslider_content_remove' : 'removeRequest'
	},
	addRequest: function(e){
		e.preventDefault();
		var file_frame = wp.media.frames.file_frame = wp.media({
	      title: 'Titulo',
	      button: {
	        text: 'Botón',
	      },
	      multiple: false  // Set to true to allow multiple files to be selected
	    });

	    file_frame.on( 'select', function() {
	      // We set multiple to false so only get one image from the uploader
	      console.log(file_frame.state().get('selection').first().toJSON());
	 
	      // Do something with attachment.id and/or attachment.url here
	      // 
	    });
	    // Finally, open the modal
    file_frame.open();
		alert('add');
	},
	editRequest: function(e){
		e.preventDefault();
		alert('edit');
	},
	removeRequest: function(e){
		e.preventDefault();
		alert('remove');
	},
	attachmentToSlide: function(attachment) {
		return new Uslider_Slide({
			images: attachment.sizes,
			title: attachment.title,
			description: attachment.description ? attachment.description : attachment.caption,
			link: false
		});
	}
});

/**
 * @type {Upfront.Views.Editor.Settings.Item}
 */
var USliderSettingsSlideContent = Upfront.Views.Editor.Settings.Item.extend({
	events: {
		'click a.uslider-slide-anchor-new-wp': 'handle_new_slide_button',
		'click a.uslider-slide-anchor-edit-wp': 'handle_show_wp_media_gallery_button',
		'click a.uslider-slide-anchor-delete': 'handle_delete_slide_button',
		'click ul.uslider-slides-thumbs li.uslider-slide-item': 'handle_slide_edit_button'
	},
	
	self: {},
	module_settings: {},
	module_slides_objs: {},
	module_slides_ids: [],

	/**
	 * Set up setting item appearance.
	 */
	render: function () {
		// Because we loose the this reference in various click events with the jQuery UI dialog and such. 
		USliderSettingsSlideContent.self = this;
		
		this.load_settings();			
			
		// Build the output for the Modal Dialog to allow editing the slide
		var slides_edit_dialog_form = this.build_slide_dialog_form();
		
		var slider_slides_html = this.build_slides_list_thumbs_html();
			slider_slides_html = '<ul class="uslider-slides-thumbs">'+slider_slides_html+'</ul>';
		
		slider_admin_html = 	'<ul class="uslider-slides-admin">';
		slider_admin_html += 	'<li class="uslider-slide-item"><a href="#" title="'+uslider_i18n['settings-content-edit-wp-slides-anchor-title']+'" class="uslider-slide-anchor-edit-wp">'+uslider_i18n['settings-content-edit-wp-slides-anchor-text']+'</a></li>';
		slider_admin_html += 	'<li class="uslider-slide-item"><a href="#" title="'+uslider_i18n['settings-content-new-slides-anchor-title']+'" class="uslider-slide-anchor-new-wp">'+uslider_i18n['settings-content-new-slides-anchor-text']+'</a></li>';
		slider_admin_html += 	'<li class="uslider-slide-item"><a href="#" disabled="disabled" title="'+uslider_i18n['settings-content-delete-slides-anchor-title']+'" class="uslider-slide-anchor-delete">'+uslider_i18n['settings-content-delete-slides-anchor-text']+' <span class="count"></span></a></li>';
		slider_admin_html += 	'</ul>';
		
		this.wrap({
			"title": uslider_i18n['settings-content-header'],
			"markup": slider_slides_html+slider_admin_html+slides_edit_dialog_form
		});						
				
		// Add support to sort/drag thumbs into order
		this.$el.find("ul.uslider-slides-thumbs").sortable({
			start: function(event, ui) {
				ui.item.addClass('uslider-is-dragged');
			},
			stop: function(event, ui) {
				// When the drag stops we record the list of IDs into our array for use later. 
				var slides_ids = [];
				USliderSettingsSlideContent.self.$el.find("ul.uslider-slides-thumbs li.uslider-slide-item a.uslider-slide-anchor").each(function(){
					slides_ids.push(jQuery(this).attr('rel'));
				});
				USliderSettingsSlideContent.module_slides_ids = slides_ids;
			}
		});

/*
		this.$el.find("ul.uslider-slides-thumbs a.uslider-slide-anchor-delete").droppable({
			accept: "ul.uslider-slides-thumbs li",
			tolerance: "touch",
			over: function( event, ui ) {
				console.log('droppable > over');
			},
			drop: function( event, ui ) {
				//$( this ).addClass( "ui-state-highlight" ).find( "p" ).html( "Dropped!" );
				console.log('droppable > drop');
			}
		});
*/
	},
	load_settings: function() {
		var uslider_content = {};
		uslider_content = this.model.get_property_value_by_name("uslider_content");
		if (uslider_content != false) {
			USliderSettingsSlideContent.module_slides_ids 	= uslider_content.module_slides_ids;
			USliderSettingsSlideContent.module_slides_objs	= uslider_content.module_slides_objs;
		} else {
			USliderSettingsSlideContent.module_slides_ids 	= [];
			USliderSettingsSlideContent.module_slides_objs	= {};
		}
	},		
	build_slides_list_thumbs_html: function() {

		var slides_list_items_html = '';
		
		for (var slide_idx in USliderSettingsSlideContent.module_slides_ids) {
			var slide_id = USliderSettingsSlideContent.module_slides_ids[slide_idx];
			var slide = USliderSettingsSlideContent.module_slides_objs[slide_id];
			if (slide['sizes'] != undefined) {
				var slide_url = slide['sizes']['thumbnail']['url'];
				slides_list_items_html += '<li id="uslider-slide-item-'+slide['id']+'" class="uslider-slide-item ui-state-default"><a rel="'+slide['id']+'" href="#" class="uslider-slide-anchor"><img src="'+slide_url+'" alt="" /></a></li>';
			} else {
				slides_list_items_html += '<li id="uslider-slide-item-'+slide['id']+'" class="uslider-slide-item ui-state-default"><a rel="'+slide['id']+'" href="#" class="uslider-slide-anchor">Text</a></li>';
			}
		}
		return slides_list_items_html;
	},
	update_slides_list_thumbs_html: function(slider_slides_html) {
		if (slider_slides_html == undefined)
			slider_slides_html = '';
		
		USliderSettingsSlideContent.self.$el.find("ul.uslider-slides-thumbs").html(slider_slides_html);
	},
	update_slides_from_attachments: function(attachments) {
		var module_slides_ids = [];
		var module_slides_objs = {};
		
		for (var attachment_idx in attachments) {
			var attachment = attachments[attachment_idx];
			
			var slide_obj = USliderSettingsSlideContent.self.convert_attachment_to_object(attachment);
			if (slide_obj != undefined) {
				module_slides_ids.push(attachment['id']);
				module_slides_objs[attachment['id']] = slide_obj;
			}
		}
		USliderSettingsSlideContent.module_slides_objs = module_slides_objs;
		USliderSettingsSlideContent.module_slides_ids 	= module_slides_ids;
	},
	// Convert from the Attachment object returned from WP Media into our own version of the object for storage
	convert_attachment_to_object: function(attachment) {

		var slide_url = '';
		if ((attachment['sizes']['full'] != undefined) && (attachment['sizes']['thumbnail'] == undefined))
			attachment['sizes']['thumbnail'] = attachment['sizes']['full'];

		slide_url = attachment['sizes']['thumbnail']['url'];
		if (slide_url != '') {

			var slide_obj = {};
			slide_obj['id'] 			= attachment['id'];
			slide_obj['title'] 			= attachment['title'];
			slide_obj['sizes'] 			= attachment['sizes'];
			slide_obj['description'] 	= attachment['description'];
			slide_obj['caption'] 		= attachment['caption'];
			slide_obj['alt'] 			= attachment['alt'];
			slide_obj['links_to'] 		= '';

			return slide_obj;
		}
	},
	build_slide_dialog_form: function() {
		slides_edit_dialog_form = 	'';
		slides_edit_dialog_form += 	'<div id="uslider-slide-edit-dialog-form" style="display:none;" title="'+uslider_i18n['settings-dialog-title-slide-edit']+'">';
		slides_edit_dialog_form += 		'<table><tr>';
		slides_edit_dialog_form += 		'<td class="uslider-slide-image-col">';
		slides_edit_dialog_form += 			'<input type="hidden" name="uslider-slide-edit-id-original" id="uslider-slide-edit-id-original" value="" />';
		slides_edit_dialog_form += 			'<input type="hidden" name="uslider-slide-edit-id" id="uslider-slide-edit-id" value="" />';
		slides_edit_dialog_form += 			'<input type="hidden" name="uslider-slide-edit-obj" id="uslider-slide-edit-obj" value="" />';
		slides_edit_dialog_form += 			'<img id="uslider-slide-image-thumb" src="" alt="" />';
		slides_edit_dialog_form += 			'<button type="button" id="uslider-slide-change-image-button">'+uslider_i18n['settings-content-dialog-change-image-button']+'</button>';		
		slides_edit_dialog_form += 			'<button type="button" id="uslider-slide-remove-image-button">'+uslider_i18n['settings-content-dialog-remove-image-button']+'</button>';		
		slides_edit_dialog_form += 		'</td>';
		slides_edit_dialog_form += 		'<td class="uslider-slide-info-col">';
		slides_edit_dialog_form += 			'<label for="uslider-slide-title">'+uslider_i18n['settings-content-dialog-title']+'</label><input type="text" name="uslider-slide-title" id="uslider-slide-title" />';
		slides_edit_dialog_form += 			'<label for="uslider-slide-description">'+uslider_i18n['settings-content-dialog-description']+'</label><textarea name="uslider-slide-description" rows="12" id="uslider-slide-description"></textarea>';
		slides_edit_dialog_form += 			'<label for="uslider-slide-links-to">'+uslider_i18n['settings-content-dialog-links-to']+'</label><input type="text" name="uslider-slide-links-to" id="uslider-slide-links-to" />';
		slides_edit_dialog_form += 		'</td>';
		slides_edit_dialog_form += 		'</tr></table>';
		slides_edit_dialog_form += 	'</div>';
		
		return slides_edit_dialog_form;
	},
	handle_show_wp_media_gallery_button: function ( event ) {

		event.preventDefault();

		// kludge to hide the #settings box with its z-index: 10000000;
		//var settings_current_zindex = jQuery('#settings').css('z-index');	// Doesn't work because the set value is large than int. Damn!
		jQuery('#settings').css('z-index', '-1');

		var gallery_ids_text = "[gallery";
		if (USliderSettingsSlideContent.module_slides_ids.length) {
			gallery_ids_text += ' ids="'+USliderSettingsSlideContent.module_slides_ids+'" ';
		} else {
			gallery_ids_text += ' ids="0" ';
		}
		gallery_ids_text += "]";
		//console.log(gallery_ids_text);
		
		wp.media.gallery.edit(gallery_ids_text).on('update', function(obj) { 

			// Return the Settings box into view. 
			jQuery('#settings').css('z-index', '10000000');

			// Here we want to convert the Backbone collection to just notive data element objects. 
			var attachments = jQuery.parseJSON(JSON.stringify(obj));
			if (attachments != '') {
				
				// First update our internal object references for the IDs and object(post item). 
				USliderSettingsSlideContent.self.update_slides_from_attachments(attachments);
				
				// Then call the function to rebuild the HTML list items for the thumbnails
				USliderSettingsSlideContent.self.update_slides_list_thumbs_html(USliderSettingsSlideContent.self.build_slides_list_thumbs_html());
			}
		});		
	},
	
	handle_slide_edit_button: function( event ) {

		event.preventDefault();
		var el = jQuery(event.target);
		
		var this_li = jQuery(el).parents('li.uslider-slide-item');
		var slide_li_id = jQuery(this_li).attr('id');
		var slide_id 	= slide_li_id.replace('uslider-slide-item-', '');
		
		
		// If the item is being dragged we added a class 'uslider-is-dragged' when the drag starts. We want to ignore these items because the jQuery UI will 
		// automatically fire a click even after the drag stops. So we remove the class we added and return.
		if (jQuery(this_li).hasClass('uslider-is-dragged')) {
			jQuery(this_li).removeClass('uslider-is-dragged');
			return;
		}

		if (event.shiftKey) {

			if (jQuery(this_li).hasClass('uslider-slide-item-delete')) {
				jQuery(this_li).removeClass('uslider-slide-item-delete');
			} else {
				jQuery(this_li).addClass('uslider-slide-item-delete');
			}
			USliderSettingsSlideContent.self.update_delete_button_count();
		} else {
			var slide = USliderSettingsSlideContent.module_slides_objs[slide_id];
		
			if ((slide != undefined) && (slide != '')) {
				USliderSettingsSlideContent.self.show_slide_edit_dialog(slide, uslider_i18n['settings-dialog-title-slide-edit']);
			}
		}
	},
	handle_new_slide_button: function( event ) {

		event.preventDefault();
		
		var slide = {};
		slide['id'] = 'new';
		USliderSettingsSlideContent.self.show_slide_edit_dialog(slide);
		
	},
	handle_delete_slide_button: function( event ) {
		event.preventDefault();
		var has_deleted = false;
		USliderSettingsSlideContent.self.$el.find("ul.uslider-slides-thumbs li.uslider-slide-item-delete a").each(function(){
			var slide_id = jQuery(this).attr('rel');

			USliderSettingsSlideContent.module_slides_ids.splice( jQuery.inArray(slide_id, USliderSettingsSlideContent.module_slides_ids), 1 );
			delete USliderSettingsSlideContent.module_slides_objs[slide_id]
			
			//console.log('delete slide_id=['+slide_id+']');
			has_deleted = true;
		});
		
		if (has_deleted == true) {
			USliderSettingsSlideContent.self.update_slides_list_thumbs_html(USliderSettingsSlideContent.self.build_slides_list_thumbs_html());
			USliderSettingsSlideContent.self.update_delete_button_count();
		}		
	},
	update_delete_button_count: function() {
		var delete_count = jQuery('ul.uslider-slides-thumbs li.uslider-slide-item-delete').length;
		if (delete_count > 0) {			
			jQuery('ul.uslider-slides-admin a.uslider-slide-anchor-delete span').html('( '+delete_count+' )')
			jQuery('ul.uslider-slides-admin a.uslider-slide-anchor-delete').attr('disabled', '');
		} else {
			jQuery('ul.uslider-slides-admin a.uslider-slide-anchor-delete span').html('');
			jQuery('ul.uslider-slides-admin a.uslider-slide-anchor-delete').attr('disabled', 'disabled');
		}					
	},
	/**
	 * Shows a slide edit or new slide dialog.
	 * @param  {Object} slide The slide object. If it is a new slide will have the id='new'
	 * @return {null}
	 */
	show_slide_edit_dialog: function(slide) {
		var self = $this,
			dialog_title = uslider_i18n['settings-dialog-title-slide-edit'],
			$dialog = $('#uslider-slide-edit-dialog-form'),
			slide_url = ''
		;

		if (slide['id'] == "new")
			dialog_title = uslider_i18n['settings-dialog-title-slide-new'];

		if (slide['sizes']) {
			if (slide['sizes']['thumbnail'])
				slide_url = slide['sizes']['thumbnail']['url'];
			else if (slide['sizes']['full'])
				slide_url = slide['sizes']['full']['url'];

			$dialog.find('#uslider-slide-remove-image-button').show();
			
		} else {
			$dialog.find('#uslider-slide-remove-image-button').hide();			
		}

		$dialog.find('#uslider-slide-image-thumb').attr('src', slide_url);
		
		if ((slide['id'] != undefined) && (slide['id'] != "new")) {
			jQuery('#uslider-slide-edit-dialog-form input#uslider-slide-edit-id').val(slide['id']);
			jQuery('#uslider-slide-edit-dialog-form input#uslider-slide-edit-id-original').val(slide['id']);
			jQuery('#uslider-slide-edit-dialog-form input#uslider-slide-edit-obj').val(JSON.stringify(slide));
		} else {
			jQuery('#uslider-slide-edit-dialog-form input#uslider-slide-edit-id').val('');
			jQuery('#uslider-slide-edit-dialog-form input#uslider-slide-edit-id-original').val(slide['id']);
			jQuery('#uslider-slide-edit-dialog-form input#uslider-slide-edit-obj').val('');
		}
	
		if (slide['title'] != undefined) {
			jQuery('#uslider-slide-edit-dialog-form input#uslider-slide-title').val(slide['title']);
		} else {
			jQuery('#uslider-slide-edit-dialog-form input#uslider-slide-title').val('');
		}
		
		if (slide['description'] != undefined) {
			jQuery('#uslider-slide-edit-dialog-form textarea#uslider-slide-description').val(slide['description']);
		} else {
			jQuery('#uslider-slide-edit-dialog-form textarea#uslider-slide-description').val('');
		}
		
		if (slide['links_to'] != undefined) {
			jQuery('#uslider-slide-edit-dialog-form input#uslider-slide-links-to').val(slide['links_to']);
		} else {
			jQuery('#uslider-slide-edit-dialog-form input#uslider-slide-links-to').val(slide['']);
		}

		USliderSettingsSlideContent.self.$el.find("#uslider-slide-edit-dialog-form button#uslider-slide-change-image-button").click(USliderSettingsSlideContent.self.handle_edit_slide_show_wp_media_single);
		USliderSettingsSlideContent.self.$el.find("#uslider-slide-edit-dialog-form button#uslider-slide-remove-image-button").click(function(){
			jQuery('#uslider-slide-edit-dialog-form input#uslider-slide-edit-id').val('');
			jQuery('#uslider-slide-edit-dialog-form input#uslider-slide-edit-obj').val('');
			jQuery('#uslider-slide-edit-dialog-form img#uslider-slide-image-thumb').attr('src', '');
			jQuery('#uslider-slide-edit-dialog-form button#uslider-slide-remove-image-button').hide();
		});

		jQuery('#settings').css('z-index', '-1');

		var buttonsOpts = {};
		buttonsOpts[uslider_i18n['settings-content-dialog-cancel-button']] = function() {
			jQuery( this ).dialog( "close" );
		
			// Return the Settings box into view. 
			jQuery('#settings').css('z-index', '10000000');						
		}
	
		buttonsOpts[uslider_i18n['settings-content-dialog-save-button']] = function() {
          jQuery( this ).dialog( "close" );
			var slide_id_original 	= jQuery('#uslider-slide-edit-dialog-form input#uslider-slide-edit-id-original').val();
			var slide_id_new 		= jQuery('#uslider-slide-edit-dialog-form input#uslider-slide-edit-id').val();
			
			var slide_obj_new 		= jQuery('#uslider-slide-edit-dialog-form input#uslider-slide-edit-obj').val();		
			if ((slide_obj_new != undefined) && (slide_obj_new != '')) {
				slide_obj_new 				= jQuery.parseJSON(slide_obj_new);
				slide_obj_new['slide_type'] = "image";
			} else {
				slide_obj_new				= {};
				slide_obj_new['slide_type'] = "text";
				slide_obj_new['id']			= slide_id_new = USliderSettingsSlideContent.self.get_slide_text_unique_id();
			}

			slide_obj_new['title'] 			= jQuery('#uslider-slide-edit-dialog-form input#uslider-slide-title').val();
			slide_obj_new['description'] 	= jQuery('#uslider-slide-edit-dialog-form textarea#uslider-slide-description').val();
			slide_obj_new['links_to'] 		= jQuery('#uslider-slide-edit-dialog-form input#uslider-slide-links-to').val();
		
			if ((slide_id_original != undefined) && (slide_id_original != '') && (slide_id_original != 'new')) {
				USliderSettingsSlideContent.self.replace_slide(slide_id_original, slide_obj_new);
			} else {
				// here need to append new slide to end of list. 
				USliderSettingsSlideContent.module_slides_objs[slide_id_new] = slide_obj_new;
				USliderSettingsSlideContent.module_slides_ids.push(slide_id_new);				
			}
			
			USliderSettingsSlideContent.self.update_slides_list_thumbs_html(USliderSettingsSlideContent.self.build_slides_list_thumbs_html());
		};

		buttonsOpts[uslider_i18n['settings-content-dialog-cancel-button']] = function() {
          	jQuery( this ).dialog( "close" );
		};

		jQuery( "#uslider-slide-edit-dialog-form" ).dialog({
			title: dialog_title, 
			autoOpen: false,
			height: 400,
			width: 450,
			modal: true,
			buttons: buttonsOpts,
			beforeClose: function( event, ui ) {
				// Return the Settings box into view. 
				jQuery('#settings').css('z-index', '10000000');				
			}
		});
	
		jQuery( "#uslider-slide-edit-dialog-form" ).dialog( "open" );
		
	},
	
	handle_edit_slide_show_wp_media_single: function( event ) {
		// Uploading files
		var file_frame;

		event.preventDefault();

		// If the media frame already exists, reopen it.
		if ( file_frame ) {
			file_frame.open();
			return;
		}

		// Create the media frame.
		file_frame = wp.media.frames.file_frame = wp.media({
			title: jQuery( this ).data( 'uploader_title' ),
			button: {
				text: jQuery( this ).data( 'uploader_button_text' ),
			},
			multiple: false  // Set to true to allow multiple files to be selected
		});

		// When an image is selected, run a callback.
		file_frame.on( 'select', function() {
			// We set multiple to false so only get one image from the uploader

			var current_slide_id = jQuery('#uslider-slide-edit-dialog-form input#uslider-slide-edit-id').val();			
			attachment = file_frame.state().get('selection').first().toJSON();
			//console.log('current_slide_id=['+current_slide_id+'] attachment[id]=['+attachment['id']+']');
			
			if (current_slide_id != attachment['id']) {
				var slide_obj = USliderSettingsSlideContent.self.convert_attachment_to_object(attachment);
				if (slide_obj != undefined) {
					jQuery('#uslider-slide-edit-dialog-form input#uslider-slide-edit-id').val(slide_obj['id']);
					jQuery('#uslider-slide-edit-dialog-form input#uslider-slide-edit-obj').val(JSON.stringify(slide_obj));
					jQuery('#uslider-slide-edit-dialog-form input#uslider-slide-title').val(slide_obj['title']);
					jQuery('#uslider-slide-edit-dialog-form textarea#uslider-slide-description').val(slide_obj['description']);				
					jQuery('#uslider-slide-edit-dialog-form input#uslider-slide-links-to').val('');

					jQuery('#uslider-slide-edit-dialog-form img#uslider-slide-image-thumb').attr('src', slide_obj['sizes']['thumbnail']['url']);
					
					jQuery('#uslider-slide-edit-dialog-form button#uslider-slide-remove-image-button').show();
				}				
			}
	    });

		// Finally, open the modal
		file_frame.open();
	},
	/** 
	 * Replaces a slide in out slides_objs group. 
	* arg: slide_id_original: Is the original slide_id from USliderSettingsSlideContent.module_slides_ids values to be replaced. 
	* arg: slide_obj_new: Is the replacement slide_obj to be updated to USliderSettingsSlideContent.module_slides_objs
	 */
	replace_slide: function(slide_id_original, slide_obj_new) {

		// We need to loop over the slide ids. Wehn we find the original id we want to replace the value of the slide_id. This will retain the slide position. 
		for (var slide_id_idx in USliderSettingsSlideContent.module_slides_ids) {
			if (USliderSettingsSlideContent.module_slides_ids[slide_id_idx] == slide_id_original) {
				USliderSettingsSlideContent.module_slides_ids[slide_id_idx] = slide_obj_new['id'];
				
				// Then we need to remove the slide_obj and add the new slide_obj in its place.
				var tmp_slide_objs = {};
				for (var slide_obj_idx in USliderSettingsSlideContent.module_slides_objs) {
					if (slide_obj_idx != slide_id_original) {
						tmp_slide_objs[slide_obj_idx] = USliderSettingsSlideContent.module_slides_objs[slide_obj_idx];
					} else {
						tmp_slide_objs[slide_obj_new['id']] = slide_obj_new;
					}
				}
				USliderSettingsSlideContent.module_slides_objs = tmp_slide_objs;
			}
		}
	},
	// For image type slides we use the image ID as the slide ID. But for text slides we need to user 'text-X'. This utility function simply counts the slides 
	// and returns that next 'text-X' ID. The X integer starts at 1
	get_slide_text_unique_id: function() {
		var text_slide_count = 0;

		for (var slide_obj_idx in USliderSettingsSlideContent.module_slides_objs) {
			var slide_obj = USliderSettingsSlideContent.module_slides_objs[slide_obj_idx];
			if ((slide_obj['slide_type'] == undefined) || (slide_obj['slide_type'] == 'text')) {
				text_slide_count = parseInt(text_slide_count) + 1;
			}
		}
		text_slide_count = parseInt(text_slide_count) + 1;

		return 'text-'+ text_slide_count;
		
	},
	/**
	 * Defines under which Property name the value will be saved.
	 * @return {string} Property name
	 */
	get_name: function () {
		return "uslider_content";
	},
	/**
	 * Extracts the finalized value from the setting markup.
	 * @return {mixed} Value.
	 */
	get_value: function () {
		return {
			slides: USliderSettingsSlideContent.module_slides_objs,
			order: USliderSettingsSlideContent.module_slides_ids
		}
		
		//console.log("get_value: module_slides_ids["+USliderSetting_Label.module_slides_ids+"]");
		//return USliderSettingsSlideContent.module_slides_ids;
		//return USliderSettingsSlideContent.module_slides_objs;
	},
	get_content: function () {
		console.log('get_content called');
		return "This is the content";
	}

});


/***********************************************************************************************************************************************
* Add Slider Menu Option
/**********************************************************************************************************************************************/

/**
 * Editor command class - this will be injected into commands
 * and allow adding the new entity instance to the work area.
 * @type {Upfront.Views.Editor.Command}
 */
var USliderElement = Upfront.Views.Editor.Sidebar.Element.extend({
	/**
	 * Set up command appearance.
	 */
	render: function () {
		this.$el.html(uslider_i18n['menu-add-slider']);
	},

	/**
	 * What happens when user clicks the command?
	 * We're instantiating a module with slider entity (object), and add it to the workspace.
	 */
	add_element: function () {
		var object = new USliderModel(), 
			module = new Upfront.Models.Module({ 
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c10 upfront-slider_module"},
					{"name": "has_settings", "value": 0}
				],
				"objects": [
					object 
				]
			})
		;
		// We instantiated the module, add it to the workspace
		this.add_module(module);
	}
});

var USliderSettings = Upfront.Views.Editor.Settings.Settings.extend({	
	/**
	 * Bootstrap the object - populate the internal
	 * panels array with the panel instances we'll be showing.
	 */
	initialize: function () {
		this.panels = _([
			new USliderSettingsPanel_Layout({model: this.model}),
			new USliderSettingsPanel_Interaction({model: this.model}),
			new USliderSettingsPanel_Components({model: this.model}),
			new USliderSettingsPanel_Content({model: this.model}),
		]);
	},
	/**
	 * Get the title (goes into settings title area)
	 * @return {string} Title
	 */
	get_title: function () {
		//return "Slider Module Settings";
		return uslider_i18n['settings-header'];
	}
});



// ----- Bringing everything together -----
// The definitions part is over.
// Now, to tie it all up and expose to the Subapplication.

Upfront.Application.LayoutEditor.add_object("USlider", {
	"Model": USliderModel, 
	"View": USliderView,
	"Element": USliderElement,
	"Settings": USliderSettings
});
Upfront.Models.USliderModel = USliderModel;
Upfront.Views.USliderView = USliderView;

})(jQuery);
