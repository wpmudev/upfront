(function($) {

define(['text!elements/upfront-contact-form/templates/ucontact.html'], function(tpl){

/**
 * Define the model for Upfront Contact form, initializing the properities
 * to their default values.
 * @type {Upfront.Models.ObjectModel}
 */
var UcontactModel = Upfront.Models.ObjectModel.extend({
	/**
	 * The init function is called after the contructor and Model intialize.
	 * Here the default values for the model properties are set.
	 */
	init: function () {
		var properties = _.clone(Upfront.data.ucontact.defaults);
		properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + "-object");
		this.init_properties(properties);
	}
});

/**
 * View instance. Contact form structure and behaviour.
 * @type {Upfront.Views.ObjectView}
 */
var UcontactView = Upfront.Views.ObjectView.extend({
	tpl: Upfront.Util.template(tpl),

	cssSelectors: {
		'label': {label: 'Field labels', info: 'Text info for every field'},
		'.ucontact-input': {label: 'Fields', info: 'Field inputs'},
		'.ucontact-field-error': {label: 'Error fields', info: 'Fields with errors.'},
		'.submit-field': {label: 'Send button', info: 'Form\'s send button'}
	},

	initialize: function(options){
		if(! (this.model instanceof UcontactModel)){
			this.model = new UcontactModel({properties: this.model.get('properties')});
		}

		this.constructor.__super__.initialize.call(this, [options]);
		Upfront.Events.on('command:layout:save_success', this.checkDeleteElement, this);
	},
	checkDeleteElement: function() {
	},
	get_content_markup: function() {
		var args = _.extend({}, this.extract_properties(), {
			message: false,
			field_classes: this.getFieldStyleClass(),
			validate: '',
			entity_id: '',
			placeholders: {
				name: this.getPlaceholder('form_name_label'),
				email: this.getPlaceholder('form_email_label'),
				subject: this.getPlaceholder('form_subject_label'),
				message: this.getPlaceholder('form_message_label')
			},
			values: {}
		});

		args.show_subject = args.show_subject && args.show_subject.length;
		args.form_add_title = args.form_add_title && args.form_add_title.length;

		return this.tpl(args);
	},
	/**
	 * A shorcut for the this.model.get_property_value_by_name function
	 * @param  {String} property Property name
	 * @return {String}          The value of the property. False if the property doesn't exists.
	 */
	property_value: function(property){
		return this.model.get_property_value_by_name(property);
	},

	extract_properties: function() {
		var props = {};
		this.model.get('properties').each(function(prop){
			props[prop.get('name')] = prop.get('value');
		});
		return props;
	},

	/**
	 * Get the classes for the field container tags, based on the element properties.
	 * The label position depends on this function.
	 * @return {String} Classes for the field container tags.
	 */
	getFieldStyleClass: function () {
		return ' ucontact-label-' + this.property_value('form_label_position');
	},

	/**
	 * Get the placeholders for the form inputs when the labels are over the fields.
	 * @param  {String} field Label property name.
	 * @return {String}       The HTML placeholder attribute if it is needed.
	 */
	getPlaceholder: function (field) {
		if(this.property_value('form_label_position') == 'over')
			return 'placeholder="' + this.property_value(field)  + '"';
		return '';
	}
});

/**
 * The upfront editor element class. This will be used to add a contact form element
 * @type {Upfront.Views.Editor.Sidebar.Element}
 */
var UcontactElement = Upfront.Views.Editor.Sidebar.Element.extend({
    priority: 140,
	/**
	 * Print the draggable element into the sidebar panel.
	 * @return {null}
	 */
	render: function () {
		this.$el.addClass('upfront-icon-element upfront-icon-element-contact');
		this.$el.html('Contact');
	},

	/**
	 * Insantiates a module with the contact form instance and add it to the workspace.
	 * @return {null}
	 */
	add_element: function() {
		var object = new UcontactModel(),
			module = new Upfront.Models.Module({
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c12 upfront-contact_form_module"},
					{"name": "has_settings", "value": 0},
					{"name": "row", "value": Upfront.Util.height_to_row(435)}
				],
				"objects": [
					object // The anonymous module will contain our contact form object model
				]
			})
		;
		this.add_module(module);
	}
});

var OptionalField = Upfront.Views.Editor.Field.Checkboxes.extend({
	className: 'upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-checkboxes upfront-field-wrap-optional',
	events: {
		'change input': 'onChange'
	},

	initialize: function(opts){
		var me = this;
		OptionalField.__super__.initialize.apply(this, arguments);

		this.options = opts;

		this.on('panel:set', function(){
			this.panel.on('rendered', function(){
				me.onChange();
			});
		});

		if(opts.onChange)
			this.onChange = opts.onChange;
	},

	onChange: function(){
		var check = this.$('input'),
			related = this.panel.$('input[name=' + this.options.relatedField + ']').closest('.upfront-field-wrap')
		;
		if(check.is(':checked'))
			related.show();
		else
			related.hide();
		console.log(related);
		$('#settings').height(this.panel.$('.upfront-settings_panel').outerHeight());
	}
});

/**
 * Contact form settings hub, populated with the panels we'll be showing.
 * @type {Upfront.Views.Editor.Settings.Settings}
 */
var UcontactSettings = Upfront.Views.Editor.Settings.Settings.extend({
	/**
	 * Bootstrap the object - populate the internal
	 * panels array with the panel instances we'll be showing (Form data and appearance).
	 */
	initialize: function(opts) {
		this.options = opts;
		var Panel = Upfront.Views.Editor.Settings.Panel,
			SettingsItem =  Upfront.Views.Editor.Settings.Item,
			Fields = Upfront.Views.Editor.Field
		;
		this.panels = _([
			this.get_general_panel(Panel, SettingsItem, Fields),
			this.get_fields_panel(Panel, SettingsItem, Fields),
			this.get_appearance_panel(Panel, SettingsItem, Fields)
		]);
	},

	get_general_panel: function(Panel, SettingsItem, Fields){
		return new Panel({
			label: 'General',
			model:  this.model,
			settings: [
				new SettingsItem({
					title: 'General setup',
					model: this.model,
					fields: [
						new Fields.Email({
							model: this.model,
							property: 'form_email_to',
							label: 'Send results to:'
						}),
						new OptionalField({
							model: this.model,
							property: 'form_add_title',
							relatedField: 'form_title',
							values: [
								{
									label: 'Use form title',
									value: 'true'
								}
							]
						}),
						new Fields.Text({
							model: this.model,
							property: 'form_title',
							label: 'Contact form title:'
						})
					]
				}),
				new SettingsItem({
					title: 'Form validation',
					model: this.model,
					fields: [
						new Fields.Radios({
							model: this.model,
							property: 'form_validate_when',
							values: [
								{
									label: 'Each field is filled out',
									value: 'field'
								},
								{
									label: 'Once send field button is clicked',
									value: 'submit'
								}
							]
						})
					]
				})
			]
		});
	},

	get_fields_panel: function(Panel, SettingsItem, Fields){
		return new Panel({
			label: 'Form Fields',
			title: 'Contact Form Fields',
			model:  this.model,
			settings: [
				new SettingsItem({
					title: 'Form fields setup',
					model: this.model,
					fields: [
						new Fields.Text({
							model: this.model,
							property: 'form_name_label',
							label: 'Name Field Text:'
						}),
						new Fields.Text({
							model: this.model,
							property: 'form_email_label',
							label: 'Email Field Text:'
						}),
						new Fields.Text({
							model: this.model,
							property: 'form_message_label',
							label: 'Message Field Text:'
						}),
						new OptionalField({
							model: this.model,
							property: 'show_subject',
							relatedField: 'form_subject_label',
							values: [
								{
									label: 'Show subject field',
									value: 'true'
								}
							],
							onChange: function(){
								var check = this.$('input'),
									related = this.panel.$('input[name=' + this.options.relatedField + ']').closest('.upfront-field-wrap'),
									defaultSubject = this.panel.$('input[name=form_default_subject]').closest('.upfront-field-wrap')
								;
								if(check.is(':checked')){
									related.show();
									defaultSubject.hide();
								}
								else{
									related.hide();
									defaultSubject.show();
								}
								console.log(related);
							}
						}),
						new Fields.Text({
							model: this.model,
							property: 'form_subject_label',
							label: 'Subject Field text:'
						}),
						new Fields.Text({
							model: this.model,
							property: 'form_default_subject',
							label: 'Default subject:'
						})
					]
				})
			]
		});
	},

	get_appearance_panel: function(Panel, SettingsItem, Fields){
		return new Panel({
			label: 'Appearance',
			model: this.model,
			settings: [
				new SettingsItem({
					title: 'Field label position',
					fields: [
						new Fields.Radios({
							model: this.model,
							property: 'form_label_position',
							values: [
								{
									label: 'Above the field',
									value: 'above',
									icon: 'contact-above-field'
								},
								{
									label: 'Over the field',
									value: 'over',
									icon: 'contact-over-field'
								},
								{
									label: 'Inline with field',
									value: 'inline',
									icon: 'contact-inline-field'
								}
							]
						})
					]
				})
			]
		});
	},

	/**
	 * Get the title (goes into settings title area)
	 * @return {String} Title
	 */
	get_title: function () {
		return "Contact form settings";
	}
});


// ----- Bringing everything together -----
// The definitions part is over.
// Now, to tie it all up and expose to the Subapplication.

Upfront.Application.LayoutEditor.add_object("Ucontact", {
	"Model": UcontactModel,
	"View": UcontactView,
	"Element": UcontactElement,
	"Settings": UcontactSettings
});

Upfront.Models.UcontactModel = UcontactModel;
Upfront.Views.UcontactView = UcontactView;

}); // End require

})(jQuery);
