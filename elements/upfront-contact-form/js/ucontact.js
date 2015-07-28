(function($) {

// Require the Upfront data, so the template resolution can work minified too
define([
	'upfront-data',
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/element-settings/panel',
	'elements/upfront-contact-form/js/settings',
	'text!elements/upfront-contact-form/templates/preset-style.html',
], function (upfront_data, ElementSettings, ElementSettingsPanel, AppearancePanel, settingsStyleTpl) {
var template = upfront_data.data && upfront_data.data.ucontact && upfront_data.data.ucontact.template
	? upfront_data.data.ucontact.template
	: 'elements/upfront-contact-form/templates/ucontact.html'
;
require(['text!' + template], function(tpl){

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

	initialize: function(options){
		if(! (this.model instanceof UcontactModel)){
			this.model = new UcontactModel({properties: this.model.get('properties')});
		}

		this.constructor.__super__.initialize.call(this, [options]);
		Upfront.Events.on('command:layout:save_success', this.checkDeleteElement, this);

		this.events = _.extend({}, this.events, {
			'click button.submit-field' : 'handleButtonclick',
			'dblclick button.submit-field' : 'editButtontext',
			'dblclick .upfront-field-container > label' : 'editLabeltext'
		});
		
		this.delegateEvents();
		
		this.listenTo(Upfront.Events, "theme_colors:update", this.update_colors, this);

	},
	
	update_colors: function () {

		var me = this,
			preset = this.model.get_property_value_by_name("preset"),
			props = PresetUtil.getPresetProperties('contact', preset) || {}
		;
		
		if (_.size(props) <= 0) return false; // No properties, carry on

		PresetUtil.updatePresetStyle('contact', props, settingsStyleTpl);

	},
	
	on_render: function() {

		var me = this;
		$button = this.$el.find('button.submit-field > span');

		$button.ueditor({
			linebreaks: true,
			disableLineBreak: true,
			//focus: true,

			airButtons: ['upfrontLink', 'stateAlignCTA', 'upfrontIcons'],
			autostart: false
		})
		.on('stop', function() {

			var ed = $button.data("ueditor"),
					text = ''
				;

			try { text = ed.getValue(true); } catch (e) { text = ''; }

			if (text) me.model.set_property('form_button_text', text, true);
		})
		;

		$labels = this.$el.find('.upfront-field-container > label');

		$labels.each(function() {
			//var content = $(this).html();
			//$(this).html('').append($('<div>').html(content));
			$label = $(this);//.children('div');
			$label.ueditor({
				linebreaks: true,
				disableLineBreak: true,
				//focus: true,

				airButtons: ['upfrontIcons'],
				autostart: false
			})
			.on('start', function(e) {
				$(e.target).closest('.upfront-field-container').children('input, textarea').attr('placeholder', '');
				$(e.target).css('opacity', 1);

			})
			.on('stop', function(e) {
				$label = $(this);

				var ed = $label.data("ueditor"),
						text = ''
					;

				if(me.model.get_property_value_by_name('form_label_position') == 'over') {
					$label.find('span').remove();
					text = $label.text();

					$(e.target).closest('.upfront-field-container').children('input, textarea').attr('placeholder', text);

					$(e.target).css('opacity', 0 );
				}
				else {

					try { text = ed.getValue(true); } catch (e) { text = ''; }
				}


				var targetproperty = false;




				if($label.attr('for') == 'sendername')
					targetproperty = 'form_name_label';
				else if($label.attr('for') == 'senderemail')
					targetproperty = 'form_email_label';
				else if($label.attr('for') == 'sendermessage')
					targetproperty = 'form_message_label';
				else if($label.attr('for') == 'subject')
					targetproperty = 'form_subject_label';
				else if($label.attr('for') == 'realPerson')
					targetproperty = 'form_captcha_label';

				if (text && targetproperty) me.model.set_property(targetproperty, text, true);
			})
			;

			if(me.model.get_property_value_by_name('form_label_position') == 'over') {
				$label.css('opacity', 0 );
				$label.siblings('input, textarea').attr('placeholder', $label.text());
			}
		});
	},
	handleButtonclick: function(e) {
		e.preventDefault();
	},
	editButtontext: function(e) {
		e.preventDefault();
		e.stopPropagation();

		$button = this.$el.find('button.submit-field > span');
		var ueditor = $button.data('ueditor');

		ueditor.start();


	},
	editLabeltext: function(e) {
		e.preventDefault();
		e.stopPropagation();

		$label = $(e.target);
		$label.css('opacity', 1);
		var ueditor = $label.data('ueditor');

		ueditor.start();


	},
	checkDeleteElement: function() {
	},
	get_content_markup: function() {
		var args = _.extend({}, this.extract_properties(), {
			message: false,
			field_classes: this.getFieldStyleClass(),
			validate: '',
			entity_id: '',
			placeholders: { },
			/*	name: this.getPlaceholder('form_name_label'),
				email: this.getPlaceholder('form_email_label'),
				subject: this.getPlaceholder('form_subject_label'),
				message: this.getPlaceholder('form_message_label')
			},*/
			ids: {},
			values: {}
		});
		
		args.preset = args.preset || 'default';

		args.show_subject = args.show_subject && args.show_subject.length;
		args.show_captcha = args.show_captcha && args.show_captcha.length;
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
    priority: 110,
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
var UcontactSettings = ElementSettings.extend({
	/**
	 * Bootstrap the object - populate the internal
	 * panels array with the panel instances we'll be showing (Form data and appearance).
	 */
	initialize: function(opts) {
		this.has_tabs = false;
		this.options = opts;
		var Panel = ElementSettingsPanel,
			SettingsItem =  Upfront.Views.Editor.Settings.Item,
			Fields = Upfront.Views.Editor.Field
		;
		this.panels = _([
			new AppearancePanel({model: this.model}),
			this.get_general_panel(Panel, SettingsItem, Fields),
			//this.get_fields_panel(Panel, SettingsItem, Fields),
			//this.get_appearance_panel(Panel, SettingsItem, Fields)
		]);
	},

	get_general_panel: function(Panel, SettingsItem, Fields){
		return new Panel({
			label: l10n.general.label,
			model:  this.model,
			settings: [
				new SettingsItem({
					title: l10n.contact_details,
					model: this.model,
					className: 'general_settings_item',
					fields: [
						new Fields.Email({
							model: this.model,
							property: 'form_email_to',
							label: l10n.general.send_to
						}),
					]
				}),	
				new SettingsItem({
					title: l10n.fields.label,
					model: this.model,
					className: 'general_settings_item multiple_radio_no_padding',
					fields: [
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
						}),
						new OptionalField({
							model: this.model,
							property: 'show_captcha',
							relatedField: 'form_captcha_label',
							values: [
								{
									label: l10n.fields.show_captcha,
									value: 'true'
								}
							],
						}),
						new Fields.Select({
							className: 'contact_label_position',
							model: this.model,
							layout: "vertical",
							label: l10n.fields.label_localtion,
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
				}),
				new SettingsItem({
					title: l10n.validation.label,
					className: 'general_settings_item',
					model: this.model,
					fields: [
						new Fields.Radios({
							className: 'inline-radios plaintext-settings',
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
						}),
					]
				}),
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
	"Settings": UcontactSettings,
	cssSelectors: {
		'label': {label: l10n.css.labels_label, info: l10n.css.labels_info},
		'.ucontact-input': {label: l10n.css.fields_label, info: l10n.css.fields_info},
		'.textarea-field' : {label: l10n.css.msg_label, info: l10n.css.msg_info},
		'.ucontact-field-error': {label: l10n.css.err_label, info: l10n.css.err_info},
		'.submit-field': {label: l10n.css.send_label, info: l10n.css.send_info}
	},
	cssSelectorsId: Upfront.data.ucontact.defaults.type
});

Upfront.Models.UcontactModel = UcontactModel;
Upfront.Views.UcontactView = UcontactView;

}); // End define
}); // End require

})(jQuery);
