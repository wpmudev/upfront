<?php
/**
 * @group upfront-core
 */
class UpfrontTest  extends WP_UnitTestCase {

	public function test_main_class_exists () {
		$this->assertTrue(class_exists('Upfront'));
	}

}
