<?php
/**
 * Contact form element for Upfront.
 */
class Upfront_UcontactView extends Upfront_Object {
	var $error = false;
	public function get_markup () {

		//Check if the form has been sent
		$this->check_form_received();
	

		return $this->get_template('ucontact', array(
			'title' => $this->_get_property('form_add_title'),
			'name_label' => $this->_get_property('form_name_label'),
			'email_label' => $this->_get_property('form_email_label'),
			'show_subject' => $this->_get_property('show_subject'),
			'subject_label' => $this->_get_property('form_subject_label'),
			'default_subject' => $this->_get_property('form_default_subject'),
			'message_label' => $this->_get_property('form_message_label'),
			'button_text' => $this->_get_property('form_button_text'),
			'field_classes' => $this->get_field_classes(),
			'id' => $this->_get_property('element_id'),
			'emailto' => $this->_get_property('form_email_to'),
			'form_style' => $this->_get_property('form_style'),
			'validate' => $this->_get_property('form_validate_when') == 'field' ? 'ucontact-validate-field' : ''
		));
	}

	public static function add_styles_scripts () {
		wp_enqueue_style('ucontact-style', upfront_element_url('css/ucontact.css', dirname(__FILE__)));
		wp_enqueue_script('ucontact-validator', upfront_element_url('js/validator.js', dirname(__FILE__)), array('jquery'));
	}

	public function on_ajax_submit () {
		$this->check_form_received();
		$error = $this->msg_class == 'error';
		$this->json_response(array(
			'error'=> $error,
			'message' => $this->msg
		));
	}

	private static function json_response ($data) {
		header("Content-type: application/json; charset=utf-8");
		die(json_encode($data));
	}

	private function check_form_received () {
		if($_POST['ucontact'] && $_POST['ucontact'] == 'sent' && $_POST['contactformid'] == $this->_get_property('element_id')){
			//Get all the needed fields and sanitize them
			$_POST = stripslashes_deep( $_POST );
			$name = sanitize_text_field($_POST['sendername']);
			$email = is_email($_POST['senderemail']);
			if($this->_get_property('show_subject'))
				$subject = sanitize_text_field($_POST['subject']);
			else
				$subject = $this->_get_property('form_default_subject');

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
		extract($args);
		ob_start();
		include dirname(dirname(__FILE__)) . '/templates/' . $templatename . '.php';
		$output = ob_get_contents();
		ob_end_clean();
		return $output;
	}

	private function get_field_classes(){
		$style = $this->_get_property('form_style');
		$label = $this->_get_property('form_label_position');
		$icons = $this->_get_property('form_use_icons');

		$classes = 'ucontact-label-' . $label . ' ucontact-field_style-' . $style;

		if($icons == 1)
			$classes .= ' ucontact-field-icons';

		return $classes;	
	}

	private function echo_placeholder($label){
		if($this->_get_property('form_label_position') == 'over')
			echo 'placeholder="' . $label . '"';
	}
}