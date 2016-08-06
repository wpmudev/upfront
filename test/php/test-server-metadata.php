<?php
/**
 * @group upfront-server
 */
class Upfront_Server_Metadata_Test  extends WP_UnitTestCase {

	public function test_exists () {
		$this->assertTrue(class_exists('Upfront_Server_Metadata'));
		$this->assertTrue(is_subclass_of('Upfront_Server_Metadata', 'IUpfront_Server'));
	}

	public function test_is_singleton () {
		$this->assertTrue(is_callable(array('Upfront_Server_Metadata', 'get_instance')));

		$meta = Upfront_Server_Metadata::get_instance();
		$this->assertTrue($meta instanceof Upfront_Server_Metadata);
		$this->assertTrue($meta instanceof IUpfront_Server);
	}

	public function test_interface () {
		$meta = Upfront_Server_Metadata::get_instance();

		// Static interface
		$this->assertTrue(is_callable(array('Upfront_Server_Metadata', 'get_instance')));
		$this->assertTrue(is_callable(array('Upfront_Server_Metadata', 'get_supported_metadesc_keys')));

		// Action handlers
		$this->assertTrue(is_callable(array($meta, 'process_metadata_saving')));
		$this->assertTrue(is_callable(array($meta, 'inject_editor_data')));
		$this->assertTrue(is_callable(array($meta, 'dispatch_meta_output')));

		// Processors
		$this->assertTrue(is_callable(array($meta, 'handle_single_meta_output')));
		$this->assertTrue(is_callable(array($meta, 'process_post_meta_update')));
	}

	public function test_runs () {
		$meta = Upfront_Server_Metadata::get_instance();

		$this->assertTrue((bool)has_action('upfront-meta_list-save', array($meta, 'process_metadata_saving')));
		$this->assertTrue((bool)has_action('upfront_data', array($meta, 'inject_editor_data')));
		$this->assertTrue((bool)has_action('wp_head', array($meta, 'dispatch_meta_output')));
	}

	public function test_injects_data () {
		$result = apply_filters('upfront_data', array());

		$this->assertTrue(!empty($result['metadata']));
		$this->assertTrue(is_array($result['metadata']));

		$this->assertTrue(!empty($result['metadata']['metadesc_key']));
		$this->assertEquals($result['metadata']['metadesc_key'], Upfront_Server_Metadata::KEY_METADESC);

		$this->assertTrue(!empty($result['metadata']['supported_metadesc_keys']));
		$this->assertEquals($result['metadata']['supported_metadesc_keys'], Upfront_Server_Metadata::get_supported_metadesc_keys());

		$this->assertTrue(!empty($result['metadata']['metadesc_length']));
		$this->assertEquals($result['metadata']['metadesc_length'], 160);
	}

	public function test_meta_save () {
		$meta = Upfront_Server_Metadata::get_instance();
		$meta_list = array(
			Upfront_Server_Metadata::KEY_METADESC => 'test string',
		);

		$post_id = wp_insert_post(array(
			'post_title' => 'test',
			'post_content' => "nanana",
		));

		$this->assertTrue(is_numeric($post_id));

		$this->assertFalse($meta->process_post_meta_update($meta_list, 'post id'), 'Requires numeric post ID');
		$this->assertFalse($meta->process_post_meta_update(array(), $post_id), 'Requires non-empty meta list');
		$this->assertFalse($meta->process_post_meta_update($meta_list, $post_id), 'Fails for random users');

		Upfront_Tests::identify_as('administrator');
		$this->assertTrue($meta->process_post_meta_update($meta_list, $post_id), 'Requires user that can edit post');
		Upfront_Tests::stop_identifying();

		$test = get_post_meta($post_id, Upfront_Server_Metadata::KEY_METADESC, true);
		$this->assertEquals($meta_list[Upfront_Server_Metadata::KEY_METADESC], $test, 'Actually saves');
	}

}
