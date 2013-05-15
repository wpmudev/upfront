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
			title => $this->_get_property('form_add_title'),
			name_label => $this->_get_property('form_name_label'),
			email_label => $this->_get_property('form_email_label'),
			show_subject => $this->_get_property('show_subject'),
			subject_label => $this->_get_property('form_subject_label'),
			default_subject => $this->_get_property('form_default_subject'),
			message_label => $this->_get_property('form_message_label'),
			button_text => $this->_get_property('form_button_text'),
			field_classes => $this->get_field_classes(),
			id => $this->_get_property('element_id'),
			emailto => $this->_get_property('form_email_to'),
			form_style => $this->_get_property('form_style')
		));
	}

	public static function add_styles () {
		wp_enqueue_style('upfront-posts', upfront_element_url('css/ucontact.css', dirname(__FILE__)));
	}

	private function check_form_received () {
		if($_POST['ucontact'] && $_POST['ucontact'] == 'sent' && $_POST['contactformid'] == $this->_get_property('element_id')){
			$name = $_POST['name'];
			$email = $_POST['email'];
			if($this->_get_property('show_subject'))
				$subject = $_POST['subject'];
			else
				$subject = $this->_get_property('form_default_subject');
			$message = $_POST['message'];

			$headers = array('Reply-To: ' + $email);

			if(! wp_mail($this->_get_property('form_email_to'), $subject, $message, $headers)){
				$this->msg = 'There was an error sending the email.';
				$this->msg_class = 'error';
			}
			else
				$this->msg = 'The email has been sent successfully.';
		}
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
}