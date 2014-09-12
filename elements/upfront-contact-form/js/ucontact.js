(function($) {

// Require the Upfront data, so the template resolution can work minified too
require(['upfront-data'], function (upfront_data) { 
var template = upfront_data.data && upfront_data.data.ucontact && upfront_data.data.ucontact.template
	? upfront_data.data.ucontact.template
	: 'elements/upfront-contact-form/templates/ucontact.html'
;
define(['text!' + template], function(tpl){

var l10n = Upfront.Settings.l10n.contact_element;

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
		'label': {label: l10n.css.labels_label, info: l10n.css.labels_info},
		'.ucontact-input': {label: l10n.css.fields_label, info: l10n.css.fields_info},
		'.textarea-field' : {label: l10n.css.msg_label, info: l10n.css.msg_info},
		'.ucontact-field-error': {label: l10n.css.err_label, info: l10n.css.err_info},
		'.submit-field': {label: l10n.css.send_label, info: l10n.css.send_info}
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
		this.$el.html(l10n.element_name);
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
			label: l10n.general.label,
			model:  this.model,
			settings: [
				new SettingsItem({
					title: 'General setup',
					model: this.model,
					fields: [
						new Fields.Email({
							model: this.model,
							property: 'form_email_to',
							label: l10n.general.send_to
						}),
						new Fields.Text({
							model: this.model,
							property: 'form_button_text',
							label: l10n.general.button_text
						}),
						new OptionalField({
							model: this.model,
							property: 'form_add_title',
							relatedField: 'form_title',
							values: [
								{
									label: l10n.general.use_title,
									value: 'true'
								}
							]
						}),
						new Fields.Text({
							model: this.model,
							property: 'form_title',
							label: l10n.general.form_title
						})
					]
				}),
				new SettingsItem({
					title: l10n.validation.label,
					model: this.model,
					fields: [
						new Fields.Radios({
							model: this.model,
							property: 'form_validate_when',
							values: [
								{
									label: l10n.validation.on_field,
									value: 'field'
								},
								{
									label: l10n.validation.on_submit,
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
			label: l10n.fields.label,
			title: l10n.fields.title,
			model:  this.model,
			settings: [
				new SettingsItem({
					title: 'Form fields setup',
					model: this.model,
					fields: [
						new Fields.Text({
							model: this.model,
							property: 'form_name_label',
							label: l10n.fields.name
						}),
						new Fields.Text({
							model: this.model,
							property: 'form_email_label',
							label: l10n.fields.email
						}),
						new Fields.Text({
							model: this.model,
							property: 'form_message_label',
							label: l10n.fields.msg
						}),
						new OptionalField({
							model: this.model,
							property: 'show_subject',
							relatedField: 'form_subject_label',
							values: [
								{
									label: l10n.fields.show_subject,
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
							label: l10n.fields.subject
						}),
						new Fields.Text({
							model: this.model,
							property: 'form_default_subject',
							label: l10n.fields.default_subject
						})
					]
				})
			]
		});
	},

	get_appearance_panel: function(Panel, SettingsItem, Fields){
		return new Panel({
			label: l10n.apr.label,
			model: this.model,
			settings: [
				new SettingsItem({
					title: 'Field label position',
					fields: [
						new Fields.Radios({
							model: this.model,
							change : function(e){
								this.model.set_property("form_label_position", this.get_value());
							},
							property: 'form_label_position',
							values: [
								{
									label: l10n.apr.above,
									value: 'above',
									icon: 'contact-above-field'
								},
								{
									label: l10n.apr.over,
									value: 'over',
									icon: 'contact-over-field'
								},
								{
									label: l10n.apr.inline,
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
		return l10n.settings;
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

}); // End define
}); // End require

})(jQuery);
