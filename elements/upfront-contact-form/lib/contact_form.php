<?php
/**
 * Contact form element for Upfront.
 */
class Upfront_UcontactView extends Upfront_Object {
	var $error = false;
	var $defaults = array();

	function __construct($data) {
		$data['properties'] = $this->merge_default_properties($data);
		parent::__construct($data);
	}

	protected function merge_default_properties($data){
		$flat = array();

		if(!isset($data['properties']))
			return $flat;

		foreach($data['properties'] as $prop)
			$flat[$prop['name']] = $prop['value'];

		$flat = array_merge(self::default_properties(), $flat);

		$properties = array();
		foreach($flat as $name => $value)
			$properties[] = array('name' => $name, 'value' => $value);

		return $properties;
	}

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
			'form_add_title' => false,
			'form_title' => 'Contact form',
			'form_name_label' => 'Your name:',
			'form_email_label' => 'Your email:',
			'form_email_to' => get_option('admin_email'),
			'show_subject' => false,
			'form_subject_label' => 'Your subject:',
			'form_default_subject' => 'Sent from the website',
			'form_message_label' => 'Your message:',
			'form_button_text' => 'Send',
			'form_validate_when' => 'submit',
			'form_label_position' => 'above',

			'type' => "UcontactModel",
			'view_class' => "UcontactView",
			"class" => "c8 upfront-contact-form",
			'has_settings' => 1
		);
	}

	public static function add_styles_scripts () {
		wp_enqueue_style('ucontact-style', upfront_element_url('css/ucontact.css', dirname(__FILE__)));
		wp_enqueue_script('ucontact-front', upfront_element_url('js/ucontact-front.js', dirname(__FILE__)), array('jquery'));
	}

	public static function ajax_send () {
		$settings  = self::get_settings_from_ajax();
		$unknown_form_error = array(
			'error' => true,
			'message' => __('Unknown contact form.')
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
				'message' => 'The contact form data is not valid.'
			);

		$contact_form = array();
		$data = $_POST['data']['properties'];
		foreach($data as $prop){
			$contact_form[$prop['name']] = $prop['value'];
		}
		if(!$contact_form['element_id'])
			return array(
				'error' => true,
				'message' => 'Unknown contact form.'
			);

		if(update_option($contact_form['element_id'], $_POST['data']))
			return array(
				'error' => false,
				'message' => 'Contact form settings stored.'
			);
		return array(
			'error' => true,
			'message' => 'There was a problem storing the contact form settings.'
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
				$this->msg = __('There was an error sending the email.');
				$this->msg_class = 'error';
			}
			else
				$this->msg = __('The email has been sent successfully.');
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
		if(empty($name))
			return __('You must write your name.');
		if(!email)
			return __('Your email address is not valid.');
		if($this->_get_property('show_subject') && empty($subject))
			return __('You must write a subject for the message.');
		if(empty($message))
			return __('You forgot to write the message.');
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
