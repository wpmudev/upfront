<?php

/**
 * Root http response class
 */
abstract class Upfront_HttpResponse {

	protected $_data;
	protected $_status = 200;
	protected $_content_type = 'text/html';
	protected $_debugger;

	private $_algo = false;
	private $_signature = false;

	public function __construct ($data) {
		$this->_data = $data;
		$this->_debugger = Upfront_Debug::get_debugger();
	}

	public function get_status () {
		return $this->_status;
	}

	public function get_content_type () {
		return $this->_content_type;
	}

	/**
	 * Gets unique content signature
	 *
	 * @param string $algo Preferred algorithm for calculating the signature (optional)
	 *
	 * @return string
	 */
	public function get_signature ($algo='sha512') {
		if (!empty($this->_signature)) return $this->_signature;

		if (!function_exists('hash_hmac') && !function_exists('hash_algos')) {
			return $this->get_fallback_signature();
		}

		$algo = $this->get_signature_algo($algo);
		if (empty($algo)) return $this->get_fallback_signature();

		$subject = serialize($this);
		return $this->_signature = hash_hmac($algo, $subject, $algo);
	}

	/**
	 * Gets best algorithm for calculating the response signature
	 *
	 * @param string $preferred First choice for algorithm selection
	 *
	 * @return bool|string Preferred algorithm, or (bool)false on failure
	 */
	public function get_signature_algo ($preferred='sha512') {
		if (!empty($this->_algo)) return $this->_algo;

		if (!function_exists('hash_hmac') || !function_exists('hash_algos')) return false;

		$algos = array($preferred, 'sha512', 'sha256', 'sha1', 'md5');
		$known = hash_algos();

		foreach ($algos as $test) {
			if (!in_array($test, $known)) continue;
			$algo = $test;
			break;
		}

		return $this->_algo = $algo;
	}

	/**
	 * Gets fallback signature
	 *
	 * Used when something goes wrong with main signature getting.
	 *
	 * @return string|bool Fallback signature, or (bool)false on failure
	 */
	public function get_fallback_signature () {
		$subject = serialize($this);

		if (function_exists('sha1')) return sha1($subject);
		if (function_exists('md5')) return md5($subject);

		return false;
	}

	abstract public function get_output ();
}
abstract class Upfront_HttpResponse_Success extends Upfront_HttpResponse {
	protected $_status = 200;
}
abstract class Upfront_HttpResponse_Error extends Upfront_HttpResponse {
	protected $_status = 500;
}

class Upfront_JsonResponse_Success extends Upfront_HttpResponse_Success {
	protected $_content_type = 'application/json';

	public function get_output () {
		return json_encode(array(
			"data" => $this->_data,
		));
	}
}
class Upfront_JsonResponse_Error extends Upfront_HttpResponse_Error {
	protected $_content_type = 'application/json';

	public function get_output () {
		return json_encode(array(
			"error" => $this->_data,
		));
	}
}

class Upfront_JavascriptResponse_Success extends Upfront_HttpResponse_Success {
	protected $_content_type = 'text/javascript';

	public function get_output () {
		return $this->_data;
	}
}
class Upfront_JavascriptResponse_Error extends Upfront_HttpResponse_Error {
	protected $_content_type = 'text/javascript';

	public function get_output () {
		return $this->_data;
	}
}

class Upfront_CssResponse_Success extends Upfront_HttpResponse_Success {
	protected $_content_type = 'text/css';
	public function get_output () {
		return $this->_data;
	}
}
class Upfront_CssResponse_Error extends Upfront_HttpResponse_Error {
	protected $_content_type = 'text/css';
	public function get_output () {}
}
