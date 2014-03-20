(function ($) {

define(function() {

/**
 * Define the model - initialize properties to their default values.
 * @type {Upfront.Models.ObjectModel}
 */
var UsearchModel = Upfront.Models.ObjectModel.extend({
	/**
	 * A quasi-constructor, called after actual constructor *and* the built-in `initialize()` method.
	 * Used for setting up instance defaults, initialization and the like.
	 */
	init: function () {
		var properties = _.clone(Upfront.data.usearch.defaults);
		properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + "-object");
		this.init_properties(properties);
	}
});

/**
 * View instance - what the element looks like.
 * @type {Upfront.Views.ObjectView}
 */
var UsearchView = Upfront.Views.ObjectView.extend({

	cssSelectors: {
		'input.search-field': {label: 'Search field', info: 'The search input field'},
		'button.search-button': {label: 'Search button', info: 'The search button'}
	},

	initialize: function(options){
		if(! (this.model instanceof UsearchModel)){
			this.model = new UsearchModel({properties: this.model.get('properties')});
		}

		this.constructor.__super__.initialize.call(this, [options]);
	},
	/**
	 * Element contents markup.
	 * @return {string} Markup to be shown.
	 */
	get_content_markup: function () {
		var placeholder = this.model.get_property_value_by_name("placeholder"),
			placeholder_text = placeholder || 'Search',
			label = this.model.get_property_value_by_name("label"),
			iconClass = label == '__image__' || !label ? ' search-icon' : ' search-text',
			image = '<i class="icon-search"></i>'
		;
		return 	'<input type="search" name="s" class="search-field' + iconClass + '" value="" placeholder="'+(placeholder ? placeholder_text : "")+'" />' +
				((label != '')?'<button class="search-button' + (label == '__image__' || !label ? ' image' : '') + iconClass + '">' + (label == '__image__' || !label ? image : label) + '</button>':'');
	},

	on_render: function () {
		var rounded = this.model.get_property_value_by_name("is_rounded"),
			color = this.model.get_property_value_by_name("color"),
			$me = this.$el.find('.upfront-editable_entity:first');
		if ( rounded == 1 )
			$me.addClass('rounded');
		else
			$me.removeClass('rounded');
		if ( color )
			$me.css('background-color', color);
		else
			$me.css('background-color', '');
	}
});

/**
 * Sidebar element class - this let you inject element into
 * sidebar elements panel and allow drag and drop element adding
 * @type {Upfront.Views.Editor.Sidebar.Element}
 */
var UsearchElement = Upfront.Views.Editor.Sidebar.Element.extend({
    priority: 200,
	/**
	 * Set up element appearance that will be displayed on sidebar panel.
	 */
	render: function () {
		this.$el.addClass('upfront-icon-element upfront-icon-element-search');
		this.$el.html('Search');
	},

	/**
	 * This will be called by editor to request module instantiation, set
	 * the default module appearance here
	 */
	add_element: function () {
		var object = new UsearchModel(), // Instantiate the model
			// Since search entity is an object,
			// we don't need a specific module instance -
			// we're wrapping the search entity in
			// an anonymous general-purpose module
			module = new Upfront.Models.Module({
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c6 upfront-search_module"},
					{"name": "has_settings", "value": 0},
					{"name": "row", "value": Upfront.Util.height_to_row(75)}
				],
				"objects": [
					object // The anonymous module will contain our search object model
				]
			})
		;
		// We instantiated the module, add it to the workspace
		this.add_module(module);
	}
});

// ----- Settings API -----
// We'll be working from the bottom up here.
// We will first define settings panels, and items for each panel.
// Then we'll slot in the panels in a settings instance.

// --- Field settings ---

/**
 * Field settings panel.
 * @type {Upfront.Views.Editor.Settings.Panel}
 */
var UsearchSettingsPanel = Upfront.Views.Editor.Settings.Panel.extend({
	/**
	 * Initialize the view, and populate the internal
	 * setting items array with Item instances.
	 */
	initialize: function () {
		this.settings = _([
			new UsearchFieldSetting_Placeholder({model: this.model}),
			new UsearchButtonSetting_Label({model: this.model})
		]);
	},
	/**
	 * Get the label (what will be shown in the settings overview)
	 * @return {string} Label.
	 */
	get_label: function () {
		return "Field";
	},
	/**
	 * Get the title (goes into settings title area)
	 * @return {string} Title
	 */
	get_title: function () {
		return "Field settings";
	}
});

/**
 * Field settings - Placeholder item
 * @type {Upfront.Views.Editor.Settings.Item}
 */
var UsearchFieldSetting_Placeholder = Upfront.Views.Editor.Settings.Item.extend({
	/**
	 * Set up setting item appearance.
	 */
	render: function () {
		var me = this;
		var placeholder = this.model.get_property_value_by_name("placeholder"),
			placeholder_text = placeholder || 'Search'
		;
		// Wrap method accepts an object, with defined "title" and "markup" properties.
		// The "markup" one holds the actual Item markup.
		this.wrap({
			"title": "Placeholder",
			"markup": '<input type="radio" id="search-placeholder-none" name="search_placeholder" value="" ' + (!placeholder ? 'checked="checked"' : '') + ' /> None' +
				'<br />' +
				'<input type="radio" id="search-placeholder-normal" name="search_placeholder" value="' + placeholder_text + '" ' + (placeholder ? 'checked="checked"' : '') + ' /> ' +
					'<span class="search-search_placeholder'+(placeholder ? ' active' : '')+'" contenteditable="true">' + placeholder_text + '</span>'
		});


		this.$el.find(".search-search_placeholder").on('click', function() {
			$(this).trigger('input');
		});

		this.$el.find(".search-search_placeholder").on("input", function () {
			$("#search-placeholder-normal").val($(this).text()).attr("checked", true);
			$(this).addClass('active');
		});

		this.$el.on("change", '#search-placeholder-normal, #search-placeholder-none', function() {

			if($(this).attr('id') == 'search-placeholder-normal' && $(this).prop('checked'))
				me.$el.find(".search-search_placeholder").addClass('active');
			else
				me.$el.find(".search-search_placeholder").removeClass('active');
		});

	},
	/**
	 * Defines under which Property name the value will be saved.
	 * @return {string} Property name
	 */
	get_name: function () {
		return "placeholder";
	},
	/**
	 * Extracts the finalized value from the setting markup.
	 * @return {mixed} Value.
	 */
	get_value: function () {
		var $placeholder = this.$el.find(':radio[name="search_placeholder"]:checked');
		return $placeholder.length ? $placeholder.val() : 0;
	}

});

// --- Button settings ---

/**
 * Button settings - Label item
 * @type {Upfront.Views.Editor.Settings.Item}
 */
var UsearchButtonSetting_Label = Upfront.Views.Editor.Settings.Item.extend({
	/**
	 * Set up setting item appearance.
	 */
	render: function () {
		var me = this;
		var value = this.model.get_property_value_by_name("label"),
			value_text = '__image__' == value || '' == value || !value ? 'Custom text' : value,
			image = '<label for="search_type-image"><i class="icon-search"></i> Image</label>',
			text = '<span class="search-search_text' + ((value !='' && value != '__image__') ? ' active' : '') + '" contenteditable="true">' + value_text + '</span>'
		;
		// Wrap method accepts an object, with defined "title" and "markup" properties.
		// The "markup" one holds the actual Item markup.
		this.wrap({
			"title": "Button content",
			"markup": '<input type="radio" id="search_type-image" name="search_type" value="__image__" ' + (value == '__image__' ? 'checked="checked"' : '') + ' /> ' + image +
				'<br />' +
				'<input type="radio" id="search_type-text" name="search_type" value="' + value_text + '" ' + ((value !='' && value != '__image__') ? 'checked="checked"' : '') + ' /> ' + text +
				'<br />' +
				'<input type="radio" id="search_type-none" name="search_type" value="" ' + (value == '' ? 'checked="checked"' : '') + ' /> <span>No Button</span>'
		});

		this.$el.find(".search-search_placeholder").on('click', function() {
			$(this).trigger('input');
		});

		this.$el.find(".search-search_text").on("input", function () {
			$("#search_type-text").val($(this).text()).attr("checked", true);
			$(this).addClass('active');
		});

		this.$el.on("change", '#search_type-image, #search_type-text, #search_type-none', function() {

			if($(this).attr('id') == 'search_type-text' && $(this).prop('checked'))
				me.$el.find(".search-search_text").addClass('active');
			else
				me.$el.find(".search-search_text").removeClass('active');
		});

	},
	/**
	 * Defines under which Property name the value will be saved.
	 * @return {string} Property name
	 */
	get_name: function () {
		return "label";
	},
	/**
	 * Extracts the finalized value from the setting markup.
	 * @return {mixed} Value.
	 */
	get_value: function () {
		var $image = this.$el.find(':radio[name="search_type"]:checked');
		return $image.length ? $image.val() : '__image__';
	}

});

// --- Tie the settings together ---

/**
 * Search settings hub, populated with the panels we'll be showing.
 * @type {Upfront.Views.Editor.Settings.Settings}
 */
var UsearchSettings = Upfront.Views.Editor.Settings.Settings.extend({
	/**
	 * Bootstrap the object - populate the internal
	 * panels array with the panel instances we'll be showing.
	 */
	initialize: function () {
		this.panels = _([
			new UsearchSettingsPanel({model: this.model})
		]);
	},
	/**
	 * Get the title (goes into settings title area)
	 * @return {string} Title
	 */
	get_title: function () {
		return "Search settings";
	}
});



// ----- Bringing everything together -----
// The definitions part is over.
// Now, to tie it all up and expose to the Subapplication.

Upfront.Application.LayoutEditor.add_object("Usearch", {
	"Model": UsearchModel,
	"View": UsearchView,
	"Element": UsearchElement,
	"Settings": UsearchSettings
});
Upfront.Models.UsearchModel = UsearchModel;
Upfront.Views.UsearchView = UsearchView;


});
})(jQuery);
