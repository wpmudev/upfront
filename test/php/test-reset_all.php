<?php
/**
 * @group upfront-ajax-admin
 */
class UpfrontAjax_AdminTest  extends WP_UnitTestCase {

	public function test_reset_all_drops_menus () {
		$child = Upfront_ChildTheme::get_instance();
		if (!($child instanceof Upfront_ChildTheme)) return false;
		$menus = json_decode($child->get_theme_settings()->get('menus'), true);
		foreach ($menus as $menu) {
			if (empty($menu['slug'])) continue; // We don't know what this is
			$obj = wp_get_nav_menu_object($menu['slug']);
			$this->assertNotFalse($obj); // Are menus here? They should be
		}

		$server = Upfront_Ajax::get_instance();
		$this->assertInstanceOf('Upfront_Ajax', $server);
		$this->assertTrue(is_callable(array($server, 'reset_all_from_db')));

		// Introduce ourselves
		Upfront_Tests::identify_as('administrator');
		$this->assertTrue(Upfront_Permissions::current(Upfront_Permissions::SAVE));

		$server->reset_all_from_db();

		foreach ($menus as $menu) {
			if (empty($menu['slug'])) continue; // We don't know what this is
			$obj = wp_get_nav_menu_object($menu['slug']);
			$this->assertFalse($obj); // Are menus here? They should NOT be
		}

		// Reset
		Upfront_Tests::stop_identifying();
		$this->assertNotTrue(Upfront_Permissions::current(Upfront_Permissions::SAVE));
	}



}
