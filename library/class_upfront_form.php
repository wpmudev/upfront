<?php
/**
 * Frontend forms interface.
 */


abstract class Upfront_FormElement {

	const FORM_TYPE_POST = 'POST';
	const FORM_TYPE_GET = 'GET';

	protected $_validation_rule = '^.*$';
	protected $_validation_modifier = '';
	protected $_type;
	protected $_name;
	protected $_label;

	protected $_submission_type = "POST";

	abstract public function get_markup ();
	abstract public function get_validation_message ();

	public function get_raw_value () {
		$arr = self::FORM_TYPE_GET == $this->_type
			? stripslashes_deep($_GET)
			: stripslashes_deep($_POST)
		;
		return !empty($arr[$this->_name])
			? $arr[$this->_name]
			: false
		;
	}

	public function has_raw_value () {
		$arr = self::FORM_TYPE_GET == $this->_type
			? stripslashes_deep($_GET)
			: stripslashes_deep($_POST)
		;
		return !empty($arr[$this->_name]);
	}

	public function set_type ($type=false) {
		$this->_type = self::FORM_TYPE_GET == $type
			? self::FORM_TYPE_GET
			: self::FORM_TYPE_POST
		;
	}

	public function get_name () {
		return $this->_name;
	}
	public function get_validation_rule () {
		return $this->_validation_rule;
	}

	public function set_name ($name) {
		$this->_name = $name;
	}
	public function set_label ($label) {
		$this->_label = $label;
	}

	public function get_value ($val=false) {
		$value = !empty($val) ? $val : $this->get_raw_value();
		$invalid = preg_replace(
			'/' . $this->_validation_rule . '/' . $this->_validation_modifier,
			'', $value
		);
		return preg_replace('/' . preg_quote($invalid, '/') . '/', '', $value);
	}

	public function is_valid ($val=false) {
		$value = !empty($val) ? $val : $this->get_raw_value();
		return preg_match(
			'/' . $this->_validation_rule . '/' . $this->_validation_modifier,
			$value
		);
	}

}


class Upfront_Form extends Upfront_FormElement {

	protected $_elements = array();

	public function __construct ($name, $type, $elements=array()) {
		$this->set_type($type);
		$this->_name = $name;
		foreach ($elements as $element) {
			$element->set_type = $this->_type;
			$this->_elements[] = $element;
		}
		$this->set_type();

		add_action('wp_footer', array($this, 'add_form_validation'));
	}

	public function get_markup () {
		$out = '<form method="' . $this->_type . '" name="' . $this->get_name() . '">';
		foreach ($this->_elements as $element) {
			if (!($element instanceof Upfront_FormElement)) continue;
			$out .= $element->get_markup() . '<br />';
		}
		$out .= '<button>Submit</button>';
		return $out . '</form>';
	}

	public function get_validation_message () {
		return __('Inspect your submission for errors outlined below', 'xzcv');
	}

	public function is_valid () {
		foreach ($this->_elements as $element) {
			if (!$element->is_valid()) return false;
		}
		return true;
	}

	public function get_value () {
		$ret = array();
		foreach ($this->_elements as $element) {
			$ret[$element->_name] = $element->get_value();
		}
		return $ret;
	}

	public function add_form_validation () {
		wp_enqueue_script('upfront-form_validation', Upfront::get_root_url() . '/scripts/form_validation.js');
		$form_data = array();
		foreach ($this->_elements as $element) {
			$name = $element->get_name();
			$form_data[$name] = array(
				"rule" => $element->get_validation_rule(),
				"message" => $element->get_validation_message(),
			);
		}
		echo '<script data-cfasync="false">' .
			'var _upfront_form_data = _upfront_form_data || {};' .
			'_upfront_form_data["' . esc_js($this->get_name()) . '"] = ' . json_encode($form_data) . '; ' .
		'</script>';
	}

}


class Upfront_InputElement extends Upfront_FormElement {

	protected $_validation_rule = '^.*$';
	protected $_validation_modifier = 'i';
	protected $_placeholder = '';
	protected $_element_type = 'text';

	public function get_markup () {
		$has_value = $this->has_raw_value();
		$is_valid = $this->is_valid();
		$value =  $has_value && $is_valid
			? $this->get_value()
			: ''
		;
		$warning = $has_value && !$is_valid;
		return '<label for="' . $this->_name . '">' .
			$this->_label . '&nbsp;' .
			'<input type="' . $this->_element_type . '" name="' . $this->_name . '" id="' . $this->_name . '" placeholder="' . $this->_placeholder . '" value="' . $value . '" />' .
			'<div class="warning" ' . ($warning ? '' : 'style="display:none"') . '>' . $this->get_validation_message() . '</div>' .
		'</label>';
	}

	public function get_validation_message () {
		return __('Please, enter the correct string', 'cxv');
	}

	public function set_placeholder ($placeholder) {
		if ($this->is_valid($placeholder)) $this->_placeholder = $placeholder;
	}
}


class Upfront_UsernameElement extends Upfront_InputElement {

	protected $_validation_rule = '^[a-z][a-z0-9]+$';

	public function get_validation_message () {
		return __('Valid usernames begin with a letter and have only alphanumeric characters.', 'cxv');
	}

}



class Upfront_PasswordElement extends Upfront_InputElement {

	const ERR_DO_NOT_MATCH = 'match';
	const ERR_INVALID_FORMAT = 'format';

	protected $_validation_rule = '^.{8,}$';
	protected $_element_type = 'password';
	protected $_repeatable_label = '';

	private $_error_type;

	public function set_repeatable_label ($label) {
		$this->_repeatable_label = $label;
	}

	public function get_repeated_name () {
		$name = $this->get_name();
		return "{$name}-repeated";
	}

	public function get_repeated_raw_value () {
		$arr = self::FORM_TYPE_GET == $this->_type
			? stripslashes_deep($_GET)
			: stripslashes_deep($_POST)
		;
		$name = $this->get_repeated_name();
		return !empty($arr[$name])
			? $arr[$name]
			: false
		;
	}

	public function get_validation_message () {
		return __('Your password has to have at least 8 characters.', 'cxv');
	}

	public function get_contextual_validation_message () {
		$msg = $this->get_validation_message();
		if (empty($this->_error)) return $msg;
		return self::ERR_DO_NOT_MATCH == $this->_error
			? __('Your passwords do not match.', 'cxv')
			: $msg
		;
	}

	public function get_markup () {
		$name = $this->get_name();
		$repeated = $this->get_repeated_name();
		$has_value = $this->has_raw_value();
		$is_valid = $this->is_valid();
		$warning = $has_value && !$is_valid;
		return '' .
			'<label for="' . $name . '">' .
				$this->_label . '&nbsp;' .
				'<input type="' . $this->_element_type . '" name="' . $name . '" id="' . $name . '" value="" />' .
				'<div class="warning" ' . ($warning ? '' : 'style="display:none"') . '>' . $this->get_contextual_validation_message() . '</div>' .
			'</label>' .
			'<br />' .
			'<label for="' . $repeated . '">' .
				$this->_repeatable_label . '&nbsp;' .
				'<input type="' . $this->_element_type . '" name="' . $repeated . '" id="' . $repeated . '" value="" />' .
				'<div class="warning" ' . ($warning ? '' : 'style="display:none"') . '>' . $this->get_contextual_validation_message() . '</div>' .
			'</label>' .
		'';
	}

	public function is_valid ($val=false) {
		$val1 = $this->get_raw_value();
		$val2 = $this->get_repeated_raw_value();
		$this->_error = self::ERR_INVALID_FORMAT;
		if (!parent::is_valid($val1) || !parent::is_valid($val2)) return false;
		$this->_error = self::ERR_DO_NOT_MATCH;
		if ($val1 == $val2) {
			$this->_error = false;
			return true;
		}
		return false;
	}

}



class Upfront_EmailElement extends Upfront_InputElement {

	protected $_validation_rule = '^[a-z][-_.+a-z0-9]+@[-_a-z0-9]+(\.[a-z]{2,3}){1,2}$';
	protected $_placeholder = 'you@yourdomain.com';
	protected $_element_type = 'email';

	public function get_validation_message () {
		return __('Please, enter a valid email', 'cxv');
	}

}



function upfront_form ($name, $type, $elements) {
	$form = new Upfront_Form($name, $type, $elements);
	return $form;
}

function upfront_email ($name, $label, $placeholder=false) {
	$email = new Upfront_EmailElement();
	$email->set_name($name);
	$email->set_label($label);
	$email->set_placeholder($placeholder);
	return $email;
}

function upfront_username ($name, $label, $placeholder=false) {
	$email = new Upfront_UsernameElement();
	$email->set_name($name);
	$email->set_label($label);
	$email->set_placeholder($placeholder);
	return $email;
}

function upfront_password ($name, $label, $placeholder=false) {
	$email = new Upfront_PasswordElement();
	$email->set_name($name);
	$email->set_label($label);
	$email->set_repeatable_label($placeholder);
	return $email;
}