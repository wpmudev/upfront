<?php
/**
 * @group upfront-model
 */
class Upfront_Model_ApiKeys_Test  extends WP_UnitTestCase {

	public function test_get_services () {
		$model = new Upfront_ApiKeys_Model;
		$opt = get_option(Upfront_ApiKeys_Model::OPTION_KEY);
		$this->assertTrue(is_array($opt), "Model array");
	}

	public function test_get_all () {
		$model = new Upfront_ApiKeys_Model;
		$opt = $model->get_all();
		$this->assertTrue(is_array($opt), "Model array");
	}

	public function test_get () {
		$model = new Upfront_ApiKeys_Model;

		$opt = $model->get();
		$this->assertFalse($opt, "No param returns false");

		$opt = $model->get('zxcvzxcvzxcv');
		$this->assertFalse($opt, "Garbage param returns false");

		$opt = $model->get(Upfront_ApiKeys_Model::SERVICE_GMAPS);
		//$this->assertNotFalse($opt, "Proper param returns key");
	}

	public function test_get_key () {
		$value1 = Upfront_ApiKeys_Model::get_key(Upfront_ApiKeys_Model::SERVICE_GMAPS);

		$model = new Upfront_ApiKeys_Model;
		$value2 = $model->get(Upfront_ApiKeys_Model::SERVICE_GMAPS);

		$this->assertEquals($value1, $value2, 'Static result comparison');
	}




}
