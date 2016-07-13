<?php
/**
 * @group upfront-admin
 */
class Upfront_Admin_ApiKeys_Test  extends WP_UnitTestCase {

	public function test_get_services () {
		require_once(dirname(__FILE__) . '/../../library/class_upfront_admin.php');
		$keys = new Upfront_Admin_ApiKeys;
		$services = $keys->get_services();

		$this->assertTrue(is_array($services), "Known services array");
		$this->assertNotEmpty($services, "Known services array not empty");
	}

	public function test_access () {
		require_once(dirname(__FILE__) . '/../../library/class_upfront_admin.php');
		$admin_keys = new Upfront_Admin_ApiKeys;

		$this->assertFalse($admin_keys->can_access(), 'Random shmoe can NOT see API options');

		Upfront_Tests::identify_as('administrator');
		$this->assertTrue($admin_keys->can_access(), 'Admin can see API options');
		Upfront_Tests::stop_identifying();

		Upfront_Tests::identify_as('editor');
		$this->assertFalse($admin_keys->can_access(), 'Editor can not see API options');
		Upfront_Tests::stop_identifying();
	}



}
