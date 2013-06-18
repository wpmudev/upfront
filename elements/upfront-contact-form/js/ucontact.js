(function($) {

/**
 * Define the model for Upfront Contact form, initializing the properities
 * to their default values.
 * @type {Upfront.Models.ObjectModel}
 */
var UcontactModel = Upfront.Models.ObjectModel.extend({
	/**
	 * The init function is called after the contructor and Model intialize.
	 * Here the default values for the model properties are set.
	 * @return {null}
	 */
	init: function () {
		this.init_properties({
			/**
			 * Model Class name
			 * @type {String}
			 */
			type: "UcontactModel",
			/**
			 * View Class name
			 * @type {String}
			 */
			view_class: "UcontactView",
			/**
			 * An id for the element. Every instance of the contact form element
			 * must have a different element_id
			 * @type {String}
			 */
			element_id: Upfront.Util.get_unique_id("ucontact-object"),
			/**
			 * Classes for the editable element in the upfront editor. Several classes
			 * can be added using spaces. The classes can be removed, added, or replaced using
			 * the methods remove_class, add_class or replace_class from ObjectModel.
			 * @type {String}
			 */
			"class": "c34 upfront-contact-form",
			/**
			 * Does this element have a settings panel?
			 * @type {Number}
			 */
			has_settings: 1,

			/*- Contact form defaults -*/

			/**
			 * The title for the contact form. If false, no title will be shown.
			 * @type {Boolean|String}
			 */
			form_add_title: false,
			/**
			 * The label for the name field of the contact form.
			 * @type {String}
			 */
			form_name_label: "Your name:",
			/**
			 * The label for the email field of the contact form.
			 * @type {String}
			 */
			form_email_label: "Your email:",
			/**
			 * Whether to show a subject field to let the user personalize the email subject.
			 * @type {Boolean}
			 */
			show_subject: false,
			/**
			 * What type of subject the contact form will have. If it is set to 'form_default_subject',
			 * the emails will be send with the value of the property 'form_default_subject'. Otherwise, this property
			 * will have a value of 'form_subject_label::[Subject label]', where [Subject label] will be the text for
			 * the optional subject field of the contact form. That [Subject label] value is stored in the property 
			 * 'form_subject_label' by the function 'set_subject_property' of the UcontactView.
			 * @type {String}
			 */
			form_subject: 'form_default_subject',
			/**
			 * The label for the optional subject field.
			 * @type {String}
			 */
			form_subject_label: 'Your subject:',			
			/**
			 * The default subject for the emails, in case that the user is not allow to write a custom
			 * subject.
			 * @type {String}
			 */
			form_default_subject: 'Sent from the website',
			/**
			 * The label for the message field.
			 * @type {String}
			 */
			form_message_label: 'Your message:',
			/**
			 * The text for the send button.
			 * @type {String}
			 */
			form_button_text: 'Send',
			/**
			 * The email address where the contact form will be sent to.
			 * @type {String}
			 */
			form_email_to: 'admin@' + location.host,
			/**
			 * When to validate the contact form. If this property value is 'field' the validation will also occur then the
			 * user edit every field. Is it is 'submit', validation will happen only when the user try to submit the
			 * contact form.
			 * @type {String}
			 */
			form_validate_when: 'submit',
			/**
			 * Where to place the label of the fields. Possible values are 'above', 'inline' and 'over'.
			 * @type {String}
			 */
			form_label_position: 'above',
			/**
			 * What form style to use
			 * @type {String}
			 */
			form_style: '1',
			/**
			 * Whether to use icons as labels for the fields.
			 * @type {Number}
			 */
			form_use_icons: 1
		});
	}
});

/**
 * View instance. Contact form structure and behaviour.
 * @type {Upfront.Views.ObjectView}
 */
var UcontactView = Upfront.Views.ObjectView.extend({
	initialize: function(options){
		this.constructor.__super__.initialize.call(this, [options]);
		Upfront.Events.on('command:layout:save_success', this.checkDeleteElement, this);
	},
	checkDeleteElement: function() {
	},
	get_content_markup: function() {
		//Add a title to the form?
		var markup = this.property_value('form_add_title') ? '<div class="upfront-contact-form-title">' + this.property_value('form_add_title') + '</div>' : '',
			fieldClasses = this.getFieldStyleClass()
		;
		
		//Set the subject depending on the model value
		this.set_subject_property();


		//Add the rest of the fields		
		markup += '<div class="upfront-field-container ' + fieldClasses + '">' +
			'<label for="name">' + this.property_value('form_name_label') + '</label>' +
			'<input type="text" class="text-field" name="name" ' + this.getPlaceholder('form_name_label') + ' />' +
		'</div>' +
		'<div class="upfront-field-container ' + fieldClasses + '">' +
			'<label for="email">' + this.property_value('form_email_label') + '</label>' +
			'<input type="email" class="email-field" name="email" ' + this.getPlaceholder('form_email_label') + ' />' +
		'</div>';
		if(this.property_value('show_subject'))
			markup += '<div class="upfront-field-container ' + fieldClasses + '">' +
			'<label for="subject">' + this.property_value('form_subject_label') + '</label>' +
			'<input type="text" class="text-field" name="subject" ' + this.getPlaceholder('form_subject_label') + ' />' +
		'</div>';

		markup += '<div class="upfront-field-container ' + fieldClasses + '">' +
			'<label for="message">' + this.property_value('form_message_label') + '</label>' +
			'<textarea class="textarea-field" name="message" ' + this.getPlaceholder('form_message_label') + '></textarea>' +
		'</div>' +
		'<div class="upfront-field-container upfront-submit-container ' + fieldClasses + '">' +
			'<input type="submit" name="send" value="' + this.property_value('form_button_text') + '" class="button submit-field">' +
		'</div>';

		return markup;
	},
	/**
	 * A shorcut for the this.model.get_property_value_by_name function
	 * @param  {String} property Property name
	 * @return {String}          The value of the property. False if the property doesn't exists.
	 */
	property_value: function(property){
		return this.model.get_property_value_by_name(property);
	},

	/**
	 * Parse the form_subject value when it is the form of '[type_of_subject]::[subject_field_label]'
	 * It stores the right values in the 'show_subject' and 'form_subject' properties.
	 * @return {null}
	 */
	set_subject_property: function(){
		var subject = this.property_value('form_subject'),
			showSubject = false,
			subjectParts = [];
		if(subject){
			subjectParts = subject.split('::');
			if(subjectParts.length == 2){
				if(subjectParts[0] == 'form_subject_label'){
					this.model.set_property('show_subject', true);
					this.model.set_property('form_subject_label', subjectParts[1]);
				}
				else{
					this.model.set_property('show_subject', false);
					this.model.set_property('form_default_subject', subjectParts[1]);

				}
			}
		}
		else
			this.model.set_property('show_subject', false);
	},

	/**
	 * Get the classes for the field container tags, based on the element properties.
	 * The label position, form style and icons labels depend on this function.
	 * @return {String} Classes for the field container tags.
	 */
	getFieldStyleClass: function () {
		var style = this.property_value('form_style'),
			classes = ' ucontact-label-' + this.property_value('form_label_position')
		;

		//Field style
		classes = style ? classes + ' ucontact-field_style-' + style : classes;

		//With icons
		return this.property_value('form_use_icons') ? classes + ' ucontact-field-icons' : classes;
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
	/**
	 * Print the draggable element into the sidebar panel.
	 * @return {null} 
	 */
	render: function () {
		//this.$el.addClass('upfront-icon-element upfront-icon-element-contact');
		this.$el.html('Contact Form');
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
					{"name": "class", "value": "c6 upfront-contact_form_module"},
					{"name": "has_settings", "value": 0}
				],
				"objects": [
					object // The anonymous module will contain our contact form object model
				]
			})
		;
		this.add_module(module);
	}
});


/**
 * Creates a settings panel for the contact form editor with all the field settings properties.
 * @type {OnSaveStoringPanel}
 */
var UcontactFieldSettingsPanel = Upfront.Views.Editor.Settings.Panel.extend({
	/**
	 * Add all the fields (settings) to the settings panel.
	 * @return {null}
	 */
	initialize: function (options) {
		// call parent initialize
		//this.constructor.__super__.initialize.call(this, [options]);
		this.settings = _([
			new UcontactField_Optional({
				model: this.model,
				field_title: 'Form fields setup',
				field_name: 'form_add_title',
				field:	new UcontactField_Text({
					//A optional field can have a child field as a option.
					model: this.model,
					field_name: 'form_title',
					field_label: 'Contact form title:',
					field_value: this.model.get_property_value_by_name('form_add_title')
				}) 
			}),
			new UcontactField_Text({
				model: this.model,
				field_name: 'form_name_label',
				field_label: 'Name Field Text:',
				field_value: this.model.get_property_value_by_name('form_name_label')
			}),
			new UcontactField_Text({
				model: this.model,
				field_name: 'form_email_label',
				field_label: 'Email Field Text:',
				field_value: this.model.get_property_value_by_name('form_email_label')
			}),
			new UcontactField_Radio({
				model: this.model,
				field_label: false,
				field_name: 'form_subject',
				field_options: [
					//A radio field can have child fields as options.
					new UcontactField_Text({
						model: this.model,
						field_name: 'form_subject_label',
						field_label: 'Subject Field Text:',
						field_value: this.model.get_property_value_by_name('form_subject_label')
					}),
					new UcontactField_Text({
						model: this.model,
						field_name: 'form_default_subject',
						field_label: 'Default subject to:',
						field_value: this.model.get_property_value_by_name('form_default_subject')
					})
				]
			}),
			new UcontactField_Text({
				model: this.model,
				field_name: 'form_message_label',
				field_label: 'Message Field Text:',
				field_value: this.model.get_property_value_by_name('form_message_label')
			}),
			new UcontactField_Text({
				model: this.model,
				field_name: 'form_button_text',
				field_label: 'Send Button Text:',
				field_value: this.model.get_property_value_by_name('form_button_text')
			}),
			new UcontactField_Email({
				model: this.model,
				field_title: 'Form Actions',
				field_name: 'form_email_to',
				field_label: 'Send results to:',
				field_value: 'admin@' + location.host
			}),
			new UcontactField_Radio({
				model: this.model,
				field_name: 'form_validate_when',
				field_label: 'Validate form when:',
				//A radio field can also have labels as options.
				field_options: [
					{label: 'Each field is filled out', value: 'field'},
					{label: 'Once send field button is clicked', value: 'submit'}
				]
			})
		]);
	},

	/**
	 * Label for the settings panel's tab
	 * @return {String} The desired text for that tab.
	 */
	get_label: function () {
		return "Form fields";
	},

	/**
	 * Title for the field settings panel.
	 * @return {String} The title for the panel
	 */
	get_title: function () {
		return "Contact form fields"
	}
});


/**
 * Creates a settings panel for the contact form editor with all the field appearance properties.
 * @type {OnSaveStoringPanel}
 */
var UcontactAppearanceSettingsPanel = Upfront.Views.Editor.Settings.Panel.extend({
	/**
	 * Add all the fields (settings) to the settings panel.
	 * @return {null}
	 */
	initialize: function (options) {
		// call parent initialize
		this.constructor.__super__.initialize.call(this, [options]);
		this.settings = _([
			new UcontactField_Radio({
				model: this.model,
				field_name: 'form_label_position',
				field_title: 'Field label position:',
				field_options: [
					{label: 'Above field', value: 'above'},
					{label: 'Over the field', value: 'over'},
					{label: 'Inline with field', value: 'inline'}
				]
			}),
			new UcontactField_Select({
				model: this.model,
				field_name: 'form_style',
				field_title: 'Form field style:',
				field_options: [
					{label: 'Theme style 01', value: '1'},
					{label: 'Theme style 02', value: '2'},
					{label: 'Theme style 03', value: '3'},
					{label: 'Theme style 04', value: '4'}
				]
			}),
			new UcontactField_Optional({
				model: this.model,
				field_name: 'form_use_icons',
				field: 'Use icons'
			})
		]);
	},

	/**
	 * Label for the settings panel's tab
	 * @return {String} The desired text for that tab.
	 */
	get_label: function () {
		return "Appearance";
	},

	/**
	 * Title for the field settings panel.
	 * @return {String} The title for the panel
	 */
	get_title: function () {
		return "Contact form appearance";
	}
});


/**
 * Abstraction of a HTML field, to be added easily to the settings panel.
 * This class is intended to be extended by an actual field which implements the function
 * 'get_markup', necessary to print the setting field's HTML out.
 * @type {Upfront.Views.Editor.Settings.Item}
 */
var UcontactField = Upfront.Views.Editor.Settings.Item.extend({
	/**
	 * Initializes the common attributes of a field. This functions must be called from any
	 * child field using the __super__ element in this way:
	 * Chilid.__super__.initialize.call(this, attrs);
	 * @param  {Object} attrs Initialization parameters.
	 */
	initialize: function(attrs){
		this.field_title = attrs.field_title ? attrs.field_title : false;
		this.field_name = attrs.field_name;
		this.field_label = attrs.field_label;
		this.field_classes = attrs.field_classes ? atts.field_classes + ' upfront-settings-item-content' : 'upfront-settings-item-content';
		this.field_value = attrs.field_value;
		this.disabled = attrs.field_disabled ? 'disabled="disabled"' : '';
	},
	/**
	 * Add the HTML of the field to the view's element. Uses the Upfront.Views.Editor.Settings.Item's wrap function
	 * to do so if there is a title attribute.
	 * @return {[type]} [description]
	 */
	render: function () {
		if(this.field_title)
			this.wrap({
				title: this.field_title,
				markup: this.get_markup()
			});
		else
			this.$el.append('<div class="upfront-settings-item"><div class="' + this.field_classes + '">' + this.get_markup() + '</div></div>');
	},

	/**
	 * Get the value of a simple input field. Complex fields must override this method.
	 * @return {String} The input value.
	 */
	get_value: function() {
		return this.$el.find('[name="' + this.field_name + '"]').val();
	},

	/**
	 * Get the field name.
	 * @return {String} Field name attribute.
	 */
	get_name: function() {
		return this.field_name;
	},
	/**
	 * Get the label text for the field.
	 * @return {String} Label text.
	 */
	get_label: function() {
		return this.field_label;
	},
	/**
	 * Set the disabled property of a field.
	 * @param  {Boolean} disabled If true, the field will not be editable.
	 * @return {null}
	 */
	set_disabled: function(disabled){
		if(disabled)
			this.disabled = 'disabled="disabled"';
		else
			this.disabled = '';
	}
});

/**
 * HTML text input field to be used in the settings panel.
 * @type {UcontactField}
 */
var UcontactField_Text = UcontactField.extend({
	/**
	 * Composes the html necessary of a text input field.
	 * @return {String} HTML of the input.
	 */
	get_markup: function () {
		var value = this.model.get_property_value_by_name(this.field_name) || this.field_value;
		value = value || '';
		return '<label for="' + this.field_name + '">' + this.field_label + '</label>' +
			'<input type="text" name="' + this.field_name + '" value="' + value + '" ' + this.disabled + ' />';
	},

});

/**
 * HTML email input field to be used in the settings panel.
 * @type {UcontactField}
 */
var UcontactField_Email = UcontactField.extend({
	/**
	 * Composes the html necessary of a email input field.
	 * @return {String} HTML of the input.
	 */
	get_markup: function () {
		var value = this.model.get_property_value_by_name(this.field_name) || this.field_value;
		value = value || '';
		return '<label for="' + this.field_name + '">' + this.field_label + '</label>' +
			'<input type="email" name="' + this.field_name + '" value="' + value + '" ' + this.disabled + ' />';
	},
});

/**
 * HTML radio input field to be used in the settings panel
 * @type {UcontactField}                                                                                                                                   [description]
 */
var UcontactField_Radio = UcontactField.extend({
	/**
	 * Add the different options for the radio input in the initialization.
	 * The field_options is an array of Object {label, value} or an array of UcontactField objects.
	 * @param  {Object} attrs Initialization data.
	 * @return {null} 
	 */
	initialize: function (attrs) {
		UcontactField_Text.__super__.initialize.call(this, attrs);
		this.options = attrs.field_options ? attrs.field_options : false;
	},
	/**
	 * Listen to the click events in the radio inputs.
	 * @type {Object}
	 */
	events: {
		'click input[type="radio"]': 'on_click'
	},
	/**
	 * Deactivate the options that are not selected when a click happens.
	 * @param  {Event} e Click event
	 * @return {null}
	 */
	on_click: function(e){
		var $input = $(e.target).parent();
		//Disable inner inputs
		$input
			.parents('.upfront-settings-item-content')
			.find('.upfront-radio-innerinput input')
			.attr('disabled', true);

		//Enable this inner input
		$input.find('.upfront-radio-innerinput input').attr('disabled', false);

		//Reset all selected classes
		$input
			.parents('.upfront-settings-item-content')
			.find('.ucontact-radio-selected')
			.removeClass('ucontact-radio-selected');

		//Add the selected class to this input
		$input.addClass('ucontact-radio-selected');
	},
	/**
	 * Composes the html necessary of a radio input field to be used in a settings panel.
	 * @return {String} HTML of the input.
	 */
	get_markup: function () {
		var markup = this.field_label ? '<label for="' + this.field_name + '">' + this.field_label + '</label>' : '',
			option = false
		;

		this.parse_value();
		
		for (var i = 0; i < this.options.length; i++) {
			var radioData = {
					extra: '', 
					checked: '',
					selected: ''
				},
				option = this.options[i]
			;
			//If the option is a Field, print it out.
			if(option instanceof UcontactField){
				radioData.label = option.get_label();
				radioData.value = option.get_name();
				if(radioData.value == this.field_value || (i == 0 && !this.field_value)){
					radioData.checked = 'checked="checked"';
					radioData.selected = 'ucontact-radio-selected';
				}
				else //If it is not the selected field, disable it.
					option.set_disabled(true);
				radioData.extra = '<div class="upfront-radio-innerinput">' + option.get_markup() + '</div>';
				
			}
			//If the option is an object, print the label and set the value.
			else {
				radioData.label = option.label,
				radioData.value = option.value ? option.value : i;
				if(radioData.value == this.field_value || (i == 0 && !this.field_value)){
					radioData.checked = 'checked="checked"';
					radioData.selected = 'ucontact-radio-selected';
				}
			}

			markup += '<div class="ucontact-radio-option ' + radioData.selected + '"><input type="radio" name="' + this.field_name + '" value="' + radioData.value  +'" '+ radioData.checked +' ' + this.disabled + ' />' + radioData.label + radioData.extra + '</div>';
		}

		return markup;
	},

	/**
	 * Get the value of the radio field. This value will be the value of the selected radio input if the options
	 * are not child Fields. If the options are child fields, the value will be a String with two parts separated 
	 * by a double colon '::'. The first part will be the name of the selected child field. The second, its value.
	 * @return {String} Value of the radio field.
	 */
	get_value: function() {
		var radioChecked = this.$el.find('input[type=radio]:checked'),
			value = radioChecked.length ? radioChecked.val() : false,
			subfield = false
		;

		if(!value)
			return false;

		subfield = radioChecked.siblings('.upfront-radio-innerinput');

		if(subfield.length)
			return value + '::' + subfield.find('input').val();

		return value;
	},

	/**
	 * Get the actual value of the radio input's HTML from the compounded value created when the radio element has
	 * a child field.
	 * @return {String} Actual value of the HTML.
	 */
	parse_value: function () {
		var value = this.model.get_property_value_by_name(this.field_name),
			valueParts = []
		;
		if(value){
			valueParts = value.split('::');
			if(valueParts.length == 2){
				this.field_value = valueParts[0];
				this.field_subfield_value = valueParts[1];
			}
			else
				this.field_value = value;
		}
	}
})

/**
 * HTML checkbox input field to be used in the settings panel.
 * @type {UcontactField}
 */
var UcontactField_Optional = UcontactField.extend({
	/**
	 * The optional field can have a child field as a label. That field will be passed as
	 * the 'optional_field' attribute when the field is created.
	 * @param  {Object} attrs Initialization data
	 * @return {null}  
	 */
	initialize: function (attrs) {
		UcontactField_Text.__super__.initialize.call(this, attrs);
		this.optional_field = attrs.field;
	},
	/**
	 * Listen to the click events in the checkbox inputs.
	 * @type {Object}
	 */
	events: {
		'click input[type="checkbox"]': 'on_click'
	},
	/**
	 * Disable any child field if the input is unchecked.
	 * @param  {Event} e Click event.
	 * @return {null}
	 */
	on_click: function (e) {
		var $input = $(e.target),
			$optional = $input.parent('.upfront-settings-item-content'),
			isDisabled = ! $input.is(':checked')
		;
		$optional.find('.ucontact-optional-innerinput input').attr('disabled', isDisabled);

		//It would be much easier if the wrap element let adding classes to the item-content div.
		if(!isDisabled){
			//In the first click, remove the class from every tag that have it.
			$optional.parent().find('.ucontact-optional-disabled').removeClass('ucontact-optional-disabled');
		}
		else //Add the class only to the container.
			$optional.addClass('ucontact-optional-disabled');
	},

	/**
	 * Composes the html necessary of a checkbox input field to be used in a settings panel.
	 * @return {String} HTML of the input.
	 */
	get_markup: function () {
		var value = this.model.get_property_value_by_name(this.field_name),
			checked = value ? 'checked="checked"' : '',
			markup = '<input type="checkbox" value="1" name="' + this.field_name + '" ' + checked + ' />',
			disabled_class = checked ? '' : ' ucontact-optional-disabled'
		;

		//This would always work if the wrap method of SettingsItem accepted the field_classes
		//attribute. Now only work if the setting field doesn't have a title.
		if(! checked)
			this.field_classes += disabled_class;

		if(this.optional_field instanceof UcontactField){
			if(!checked)
				this.optional_field.set_disabled(true);
			return markup + '<div class="ucontact-optional-innerinput' + disabled_class + '">' + this.optional_field.get_markup() + '</div>';
		}

		//Otherwise a actual field, we use the string as a label for the checkbox
		return markup + '<label for="' + this.field_name  + '" class="' + disabled_class + '">' + this.optional_field + '</label>';
	},

	/**
	 * Get the value of the checkbox field. This value will be the value of the child field there is any when checked.
	 * If there is no child field, the value will be 1 when checked.
	 * The value will be 0 when not checked.
	 * @return {String} Value of the radio field.
	 */
	get_value: function(){
		var checkbox = this.$el.find('input[name=' + this.field_name + ']');
		if(!checkbox.length || !checkbox.is(':checked'))
			return 0; // Not checked;

		if(this.optional_field instanceof UcontactField_Text){
			return this.$el.find('input[name=' + this.optional_field.get_name() + ']').val();
		}
		return 1; 
	}
});

/**
 * HTML select field to be used in the settings panel.
 * @type {UcontactField}
 */
var UcontactField_Select = UcontactField.extend({
	/**
	 * Add the different options for the radio input in the initialization.
	 * The field_options is an array of Object {label, value}.
	 * It is posible to set a multiple select field setting the 'field_multiple' attribute to true.
	 * @param  {Object} attrs Initialization data.
	 * @return {null} 
	 */
	initialize: function (attrs) {
		UcontactField_Text.__super__.initialize.call(this, attrs);
		this.field_options = attrs.field_options;
		this.field_multiple = attrs.field_multiple ? 'multiple="multiple"' : '';
	},
	/**
	 * Composes the html necessary of a select field to be used in a settings panel.
	 * @return {String} HTML of the input.
	 */
	get_markup: function () {
		var value = this.model.get_property_value_by_name(this.field_name),
			markup = this.field_label ? '<label for="' + this.field_name + '">' + this.field_label + '</label>' : ''
		;

		markup += '<select ' + this.field_multiple + ' name="' + this.field_name + '" ' + this.disabled + '>';

		for (var i = 0; i < this.field_options.length; i++) {
			var option = this.field_options[i],
				selected = value == option.value ? 'selected="selected"' : false;

			markup += '<option value="' + option.value + '" ' + selected + '>' + option.label + '</option>';

		};

		return markup + '</select>';
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
	initialize: function() {
		this.panels = _([
			new UcontactFieldSettingsPanel({model: this.model}),
			new UcontactAppearanceSettingsPanel({model: this.model})
		]);
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


})(jQuery);