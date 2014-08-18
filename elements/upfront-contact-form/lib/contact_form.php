<?php
/**
 * Contact form element for Upfront.
 */
class Upfront_UcontactView extends Upfront_Object {
	var $error = false;
	var $defaults = array();

	public function get_markup () {

		//Check if the form has been sent
		$this->check_form_received();
		$args = array_merge($this->properties_to_array(), array(
			'field_classes' => $this->get_field_classes(),
			'validate' => $this->_get_property('form_validate_when') == 'field' ? 'ucontact-validate-field' : '',
			'message' => isset($this->msg) ? $this->msg : false,
			'message_class' => isset($this->msg_class) ? $this->msg_class : 'error',
			'entity_id' => $this->get_entity_ids_value(),
			'placeholders' => array(
				'name' => $this->get_placeholder($this->_get_property('form_name_label')),
				'email' => $this->get_placeholder($this->_get_property('form_email_label')),
				'subject' => $this->get_placeholder($this->_get_property('form_subject_label')),
				'message' => $this->get_placeholder($this->_get_property('form_message_label'))
			),
			'values' => array(
				'name' => $this->get_post('sendername'),
				'email' => $this->get_post('senderemail'),
				'subject' => $this->get_post('subject'),
				'message' => $this->get_post('sendermessage')
			)
		));

		$args['show_subject'] = $args['show_subject'] && sizeof($args['show_subject']);
		$args['form_add_title'] = $args['form_add_title'] && sizeof($args['form_add_title']);

		$markup =  $this->get_template('ucontact', $args);

		return $markup . '
			<script type="text/javascript">
				if(! window.ajax_url)
					ajax_url = "' . admin_url( 'admin-ajax.php' ) . '";
			</script>';
	}

	private function properties_to_array(){
		$out = array();
		foreach($this->_data['properties'] as $prop)
			$out[$prop['name']] = $prop['value'];
		return $out;
	}

	public function add_js_defaults($data){
		$data['ucontact'] = array(
			'defaults' => self::default_properties(),
			'template' => upfront_get_template_url('ucontact', upfront_element_url('templates/ucontact.html', dirname(__FILE__)))
		);
		return $data;
	}

	public static function default_properties(){
		return array(
			'form_add_title' => array(),
			'form_title' => self::_get_l10n('contact_form'),
			'form_name_label' => self::_get_l10n('name_label'),
			'form_email_label' => self::_get_l10n('email_label'),
			'form_email_to' => get_option('admin_email'),
			'show_subject' => array(),
			'form_subject_label' => self::_get_l10n('subject_label'),
			'form_default_subject' => self::_get_l10n('default_subject'),
			'form_message_label' => self::_get_l10n('message_label'),
			'form_button_text' => self::_get_l10n('button_text'),
			'form_validate_when' => 'submit',
			'form_label_position' => 'above',


			'type' => "UcontactModel",
			'view_class' => "UcontactView",
			"class" => "c24 upfront-contact-form",
			'has_settings' => 1,
			'id_slug' => 'ucontact'
		);
	}

	public static function add_styles_scripts () {
		upfront_add_element_style('ucontact-style', array('css/ucontact.css', dirname(__FILE__)));
		wp_enqueue_script('ucontact-front', upfront_element_url('js/ucontact-front.js', dirname(__FILE__)), array('jquery'));
	}

	public static function ajax_send () {
		$settings  = self::get_settings_from_ajax();
		$unknown_form_error = array(
			'error' => true,
			'message' => self::_get_l10n('unknown_form'),
		);

		if(!$settings)
			return $unknown_form_error;

		$form = new Upfront_UcontactView($settings);

		if(!$form)
			return $unknown_form_error;

		$form->check_form_received();

		return array(
			'error'=> $form->msg_class == 'error',
			'message' => $form->msg
		);
	}

	public static function store () {
		if(!$_POST['data'] || !$_POST['data']['properties'])
			return array(
				'error' => true,
				'message' => self::_get_l10n('invalid_data')
			);

		$contact_form = array();
		$data = $_POST['data']['properties'];
		foreach($data as $prop){
			$contact_form[$prop['name']] = $prop['value'];
		}
		if(!$contact_form['element_id'])
			return array(
				'error' => true,
				'message' => self::_get_l10n('unknown_form')
			);

		if(update_option($contact_form['element_id'], $_POST['data']))
			return array(
				'error' => false,
				'message' => self::_get_l10n('settings_stored')
			);
		return array(
			'error' => true,
			'message' => self::_get_l10n('store_error')
		);
	}

	private static function json_response ($data) {
		header("Content-type: application/json; charset=utf-8");
		if($data instanceof Upfront_HttpResponse)
			die($data->get_output());
		die(json_encode($data));
	}

	private function check_form_received () {
		if(isset($_POST['ucontact']) && $_POST['ucontact'] == 'sent' && $_POST['contactformid'] == $this->_get_property('element_id')){
			//Get all the needed fields and sanitize them
			$_POST = stripslashes_deep( $_POST );
			$name = sanitize_text_field($_POST['sendername']);
			$email = is_email($_POST['senderemail']);
			$show_subject = $this->_get_property('show_subject');

			if($show_subject && $show_subject != 'false'){
				$subject = sanitize_text_field($_POST['subject']);
			}
			else{
				$show_subject = false;
				$subject = $this->_get_property('form_default_subject');
			}

			//Strip unwanted tags from the message
			$message = wp_kses(
				$_POST['sendermessage'],
				array(
				    'a' => array(
				        'href' => array (),
				        'title' => array ()),
				    'abbr' => array(
				        'title' => array ()),
				    'acronym' => array(
				        'title' => array ()),
				    'b' => array(),
				    'blockquote' => array(
				        'cite' => array ()),
				    'cite' => array (),
				    'code' => array(),
				    'del' => array(
				        'datetime' => array ()),
				    'em' => array (), 'i' => array (),
				    'q' => array(
				        'cite' => array ()),
				    'strike' => array(),
				    'strong' => array(),
				)
			);

			$emailto = $this->_get_property('form_email_to');


			$headers = array('Reply-To: ' . $email);

			$this->msg = $this->check_fields($name, $email, $subject, $message);

			if ($this->msg)
				$this->msg_class = 'error';

			else if(! wp_mail($emailto, $subject, $message, $headers)){
				$this->msg = self::_get_l10n('error_sending');
				$this->msg_class = 'error';
			}
			else
				$this->msg = self::_get_l10n('mail_sent');
		}
	}

	public function get_post($param){
		return isset($_POST[$param]) ? $_POST[$param] : '';
	}

	/**
	 * Validation check for the contact form fields.
	 * @param  String $name    Name sent by the user
	 * @param  String $email   Email sent by the user
	 * @param  String $subject Subject for the email
	 * @param  String $message Message sent by the user
	 * @return String|Boolean          A message with the error or false if no errors.
	 */
	private function check_fields($name, $email, $subject, $message){
		if (empty($name)) return self::_get_l10n('missing_name');
		if (empty($email)) return self::_get_l10n('invalid_email');
		if($this->_get_property('show_subject') && empty($subject)) return self::_get_l10n('missing_subject');
		if(empty($message)) return self::_get_l10n('missing_message');
		return false;
	}

	/**
	 * Parses the PHP file output to a variable
	 */
	private function get_template($templatename, $args = array()){
		return upfront_get_template('ucontact', $args, dirname(dirname(__FILE__)) . '/templates/ucontact.html');
	}

	public function get_entity_ids_value(){
		$entities = Upfront_EntityResolver::get_entity_ids();
		//var_dump($entities);
		return base64_encode(json_encode($entities));
	}

	private function get_settings_from_ajax(){
		try{
			$entity_ids = (array) json_decode(base64_decode($_POST['entity_ids']));
		} catch(Exception $e) {
			return false;
		}

		$layout = Upfront_Layout::from_entity_ids($entity_ids);

		if($layout instanceof Upfront_Layout)
			$layout = $layout->to_php();
		else
			return false;

		$settings = array();

		if(is_array($layout['regions'])){
			foreach($layout['regions'] as $region){
				if(sizeof($region['modules'])){
					foreach($region['modules'] as $module){
						if(sizeof($module['objects'])){
							foreach($module['objects'] as $object){
								if(sizeof($object['properties'])){
									foreach($object['properties'] as $prop){
										if($prop['name'] == 'element_id' && $prop['value'] == $_POST['contactformid'])
											return $object;
									}
								}
							}
						}
					}
				}
			}
		}
		return false;
	}

	private function get_field_classes(){
		return 'ucontact-label-' . $this->_get_property('form_label_position');
	}

	public function get_placeholder($label){
		if($this->_get_property('form_label_position') == 'over')
			return 'placeholder="' . $label . '"';
		return '';
	}

	public static function add_l10n_strings ($strings) {
		if (!empty($strings['contact_element'])) return $strings;
		$strings['contact_element'] = self::_get_l10n();
		return $strings;
	}

	private static function _get_l10n ($key=false) {
		$l10n = array(
			'element_name' => __('Contact', 'upfront'),
			'contact_form' => __('Contact form', 'upfront'),
			'name_label' => __('Your name:', 'upfront'),
			'email_label' => __('Your email:', 'upfront'),
			'subject_label' => __('Your subject:', 'upfront'),
			'default_subject' => __('Sent from the website', 'upfront'),
			'message_label' => __('Your message:', 'upfront'),
			'button_text' => __('Send', 'upfront'),
			'unknown_form' => __('Unknown contact form.', 'upfront'),
			'invalid_data' => __('The contact form data is not valid.', 'upfront'),
			'settings_stored' => __('Contact form settings stored.', 'upfront'),
			'store_error' => __('There was a problem storing the contact form settings.', 'upfront'),
			'error_sending' => __('There was an error sending the email.', 'upfront'),
			'mail_sent' => __('The email has been sent successfully.', 'upfront'),
			'missing_name' => __('You must write your name.', 'upfront'),
			'invalid_email' => __('Your email address is not valid.', 'upfront'),
			'missing_subject' => __('You must write a subject for the message.', 'upfront'),
			'missing_message' => __('You forgot to write the message.', 'upfront'),
			'css' => array(
				'labels_label' => __('Field labels', 'upfront'),
				'labels_info' => __('Text info for every field', 'upfront'),
				'fields_label' => __('Fields', 'upfront'),
				'fields_info' => __('Field inputs', 'upfront'),
				'msg_label' => __('Mesage Field', 'upfront'),
				'msg_info' => __('Mesasge field', 'upfront'),
				'err_label' => __('Error fields', 'upfront'),
				'err_info' => __('Fields with errors.', 'upfront'),
				'send_label' => __('Submit button', 'upfront'),
				'send_info' => __('Form\'s submit button', 'upfront'),
			),
			'general' => array(
				'label' => __('General', 'upfront'),
				'send_to' => __('Send results to:', 'upfront'),
				'button_text' => __('Contact form submit button text:', 'upfront'),
				'use_title' => __('Use form title', 'upfront'),
				'form_title' => __('Contact form title:', 'upfront'),
			),
			'validation' => array(
				'label' => __('Form validation', 'upfront'),
				'on_field' => __('Each field is filled out', 'upfront'),
				'on_submit' => __('Once send field button is clicked', 'upfront'),
			),
			'fields' => array(
				'label' => __('Form Fields', 'upfront'),
				'title' => __('Contact Form Fields', 'upfront'),
				'name' => __('Name Field Text:', 'upfront'),
				'email' => __('Email Field Text:', 'upfront'),
				'msg' => __('Message Field Text:', 'upfront'),
				'show_subject' => __('Show subject field', 'upfront'),
				'subject' => __('Subject Field text:', 'upfront'),
				'default_subject' => __('Default subject:', 'upfront'),
			),
			'apr' => array(
				'label' => __('Appearance', 'upfront'),
				'above' => __('Above the field', 'upfront'),
				'over' => __('Over the field', 'upfront'),
				'inline' => __('Inline with field', 'upfront'),
			),
			'settings' => __('Contact form settings', 'upfront'),
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
	}
}

class Ucontact_Server extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('wp_ajax_upfront_contact-form',  array($this, 'on_ajax_send'));
		add_action('wp_ajax_nopriv_upfront_contact-form',  array($this, 'on_ajax_send'));
	}

	public function on_settings_store () {
		$this->send_results(Upfront_UcontactView::store());
	}

	public function on_ajax_send () {
		$this->send_results(Upfront_UcontactView::ajax_send());

	}
	protected function send_results ($results) {
		if($results['error'])
			$this->_out(new Upfront_JsonResponse_Error($results['message']));
		else
			$this->_out(new Upfront_JsonResponse_Success($results));
	}
}
