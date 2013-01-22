<?php

/**
 * Root http response class
 */
abstract class Upfront_HttpResponse {

	protected $_data;
	protected $_status = 200;
	protected $_content_type = 'text/html';
	protected $_debugger;

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

class Upfront_CssResponse_Succcess extends Upfront_HttpResponse_Success {
	protected $_content_type = 'text/css';
	public function get_output () {
		return $this->_data;
	}	
}
class Upfront_CssResponse_Error extends Upfront_HttpResponse_Error {
	protected $_content_type = 'text/css';
	public function get_output () {}	
}