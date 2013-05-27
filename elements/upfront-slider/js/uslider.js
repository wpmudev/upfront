// See uslide_configurations.js for options/setup and I18N. 
(function ($) {

//Slide Model
var Uslider_Slide = Backbone.Model.extend({
	defaults: {
		images: [],
		title: '',
		description: '',
		link: false,
		attachmentId: 0,
		id:0
	},

	initialize: function() {
		this.set('id', this.cid);
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
		var self = this,
			slideTemplateSelector = this.model.get_property_value_by_name('slide_style') == 'text' ? '#uslider-content-textslide-template' : '#uslider-content-imgslide-template',
			settingContent = this.$('.upfront-settings-item-content');

		if(settingContent.length){
			settingContent.html(this.template({
				slides: this.slides.toJSON(),
				slideTemplate: _.template($(slideTemplateSelector).html())
			}));
		}
		else{
			this.wrap({
				title: 'Slider contents',
				markup: this.template({
					slides: this.slides.toJSON(),
					slideTemplate: _.template($(slideTemplateSelector).html())
				})
			});
			//Make the thumbs sortable
			this.$('.uslider_content_thumbs').sortable({
				start: function(event, ui) {
					ui.item.addClass('uslider-is-dragged');
				},
				stop: function(event, ui) {
					// When the drag stops we record the list of IDs into our array for use later. 
					var slideId = ui.item.attr('rel'),
						newPosition = self.getSlidePosition(slideId),
						slide = false,
						slides = self.slides;
					if(newPosition != -1){
						slide = slides.get(slideId);
						slides.remove(slideId, {silent:true});
						self.slides.add(slide, {silent:true, at: newPosition});
					}
				}			
			});
		}
	},
	addSlideEvents: function(){
		var self = this;
		this.slides.on('add remove sort reset', this.render, this);
	},
	events: {
		'click a.uslider_content_add' : 'addRequest',
		'click a.uslider_content_edit' : 'editRequest',
		'click a.uslider_content_remove' : 'removeRequest',
		'click .uslider_content_slide': 'selectSlide'
	},
	addRequest: function(e){
		e.preventDefault();
		this.openMediaSelector(false);
	},
	editRequest: function(e){
		e.preventDefault();
		this.openMediaSelector(true);
	},
	removeRequest: function(e){
		var remove = confirm('Are you sure to remove the slide?');
		if(remove){
			this.slides.remove(this.selectedSlide);
			this.selectedSlide = false;
		}
	},
	selectSlide: function(e){
		var target = $(e.currentTarget);
		this.$('div.slide-selected').removeClass('slide-selected');
		target.addClass('slide-selected');		

		// Set the selected slide
		this.selectedSlide = this.slides.get(target.attr('rel'));
	},

	openMediaSelector: function(edit){
		var self = this,
			selection = [];

		if(edit)
			selection.push(this.selectedSlide.get('attachmentId'));

		this.usliderFrame = wp.media.frames.usliderFrame = wp.media({
	      title: edit ? 'Edit slide' : 'New slide',
	      button: {
	        text: edit ? 'Save slide' : 'Add slide',
	      },
	      className: 'media-frame uslider-frame',
	      library: {
	      	type: 'image'
	      },
	      multiple: false,  // Set to true to allow multiple files to be selected
	      selection: selection
	    });

	    this.usliderFrame.edit = edit;

		//Set event handlers and open the modal
	    this.usliderFrame
	    	.on( 'select', function() {
				self.usliderFrame.edit ? self.updateSlide(self.usliderFrame.slide) : self.addSlide(self.usliderFrame.slide);
		    })
		    .on( 'open', function() {
		    	if(self.usliderFrame.edit)
		    		self.updateSelection();
		    	$('#settings').hide();
		    })
		    .on( 'close', function() {
		    	$('#settings').show();
		    })
		    .on( 'content:create:browse', function(content) {
		    	if(content.view){
		    		content.view.options.selection.on( 'selection:single', self.addSliderToSidebar, self );
		    		self.editorSidebar = content.view.sidebar;
		    	}
		    	if(self.usliderFrame.edit)
		    		self.usliderFrame.slide = self.slides.get(self.selectedSlide);
		    	else
		    		self.usliderFrame.slide = new Uslider_Slide();
		    	//console.log(content);
		    })
		    .open();

	},
	updateSelection: function (attachmentId) {
		var selection = this.usliderFrame.state().get('selection'),
			attachment = wp.media.attachment(this.selectedSlide.get('attachmentId'));

		selection.reset([attachment]);
	},
	addSliderToSidebar: function (selection) {
		var self = this,
			editor = this.editorSidebar.$('#uslider-editor'),
			slide = this.usliderFrame.slide;

		slide.set({
			attachmentId: selection.get('id'),
			images: selection.get('sizes')
		});		

		if(editor.length)
			editor.html(_.template($('#uslider-slide-editorform').html(), slide.toJSON()));
		else {
			var form = $('<div id="uslider-editor"></div>')
							.on('blur', 'input', function(e){
								var $this = $(this),
									slideAttribute = $this.attr('rel');
								slide.set(slideAttribute, $this.val());
							})
							.html(_.template($('#uslider-slide-editorform').html(), slide.toJSON()));
			this.editorSidebar.$el.append(form);
		}
	},
	updateSlide: function(newSlide) {
		this.slides.add(newSlide, {merge: true});
		this.render();
	},
	addSlide: function(slide){
		this.slides.add(slide);
	},
	getSlidePosition: function(slideId){
		var i = 0,
			found = false;
		this.$('div.uslider_content_slide').each(function(item){
			if($(this).attr('rel') == slideId)
				found = i;
			i++;
		});
		if(found !== false)
			return found;
		return -1;
	},
	get_name: function() {
		return 'slides';
	},
	get_value: function() {
		return this.slides.toJSON();
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
