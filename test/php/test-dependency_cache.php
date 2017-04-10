<?php
/**
 * @group cache
 */
class DependencyCacheTest  extends WP_UnitTestCase {

	public function test_cache_class_bootstrap () {
		$this->assertTrue(
			class_exists('Upfront_DependencyCache_Server', false),
			'Class exists and is being loaded in time'
		);
		$this->assertTrue(
			in_array('IUpfront_Server', class_implements('Upfront_DependencyCache_Server', false)),
			'Dependency cache class is a server'
		);

		$this->assertTrue(
			is_callable(array('Upfront_DependencyCache_Server', 'get_instance')),
			'Caching server class is also a singleton'
		);
		$cache = Upfront_DependencyCache_Server::get_instance();
		$this->assertTrue(
			$cache instanceof Upfront_DependencyCache_Server,
			'Siingleton getter returns proper object instance'
		);

		Upfront_DependencyCache_Server::serve();
		$this->assertTrue(
			$cache->is_running(),
			'Cache server booted properly'
		);

		$this->assertTrue(
			!!has_filter('upfront-output-experimental-done', array($cache, 'handle_cached_output')),
			'Dependency cache hooks up to experiments output filtering'
		);

	}

	public function test_paths_resolution () {
		$cache = Upfront_DependencyCache_Server::get_instance();
		$this->assertTrue(
			file_exists($cache->get_cache_dir()),
			'Cache root directory exists, or gets created'
		);

		$resource_dir = $cache->get_resource_dir();
		$this->assertTrue(
			file_exists($resource_dir),
			'Resources subdir exists, or gets created'
		);

		$src = 'test.file.name';
		$content = 'test';
		$key = $cache->get_key($src);

		$path = $cache->get_resource_path($src);
		$expected = wp_normalize_path("{$resource_dir}/{$key}");
		$this->assertEquals(
			$path, $expected,
			'Resource path resolves properly'
		);

		$this->assertFalse(
			$cache->has_cached_resource($src),
			'Invalid cache resource file does not exist'
		);
		$this->assertFalse(
			$cache->get_cached_resource($src),
			'Invalid resource reading returns false'
		);

		file_put_contents($path, $content);
		$this->assertTrue(
			$cache->has_cached_resource($src),
			'Shimmed resource file exists'
		);
		$this->assertEquals(
			$cache->get_cached_resource($src), $content,
			'Shimmed resource read successfully'
		);

		unlink($path);
	}

	public function test_dynamic_resources () {
		$cache = Upfront_DependencyCache_Server::get_instance();
		$ajax = admin_url('admin-ajax.php');

		$this->assertTrue(
			$cache->is_dynamic_resource_url("{$ajax}?test=yes"),
			'AJAX URLs are dynamic resources'
		);
		$this->assertFalse(
			$cache->is_dynamic_resource_url(home_url('test')),
			'Non-AJAX URLs are not dynamic resources (even though they may be)'
		);
		$this->assertFalse(
			$cache->is_dynamic_resource_url(home_url('test?q=' . $ajax)),
			'Edge case scenario with AJAX URL in query string is not dynamic resource'
		);
	}

	public function test_protocol_stripping () {
		$cache = Upfront_DependencyCache_Server::get_instance();
		$checks = array(
			'http://test' => '//test',
			'https://test' => '//test',
			'test' => 'test',
			false => ''
		);
		foreach ($checks as $test => $expected) {
			$this->assertEquals(
				$cache->strip_protocol($test), $expected,
				"Stripping protocol from {$test} matches expected {$expected}"
			);
		}
	}

	public function test_url_to_path_resolution () {
		$cache = Upfront_DependencyCache_Server::get_instance();
		$checks = array(
			Upfront::get_root_url() . '/scripts/chosen/chosen.min.css' => Upfront::get_root_dir() . '/scripts/chosen/chosen.min.css',
			home_url('test') => false, // Because we're only considering upfront resources
			'nanana/lalala' => false,
			'http://www.fakedomain.gtfo/fakepath' => false,
			admin_url('admin-ajax.php?action=saywhat') => false,
		);
		foreach ($checks as $test => $expected) {
			$this->assertEquals(
				$cache->url_to_path($test), $expected,
				"Converting {$test} to path matches {$expected}"
			);
		}
	}

	public function test_content_getting () {
		$cache = Upfront_DependencyCache_Server::get_instance();
		$checks = array(
			Upfront::get_root_url() . '/scripts/chosen/chosen.min.css' => file_get_contents(Upfront::get_root_dir() . '/scripts/chosen/chosen.min.css'),
			admin_url('/scripts/chosen/chosen.min.css') => '',
			'test' => '',
			'http://fakedomain.gtfo/test' => '',
		);
		foreach ($checks as $test => $expected) {
			$this->assertEquals(
				$cache->get_content($test), $expected,
				"Getting content from {$test} matched expected result"
			);
		}
	}

	public function test_caching_output () {
		$deps = Upfront_CoreDependencies_Registry::get_instance();
		$cache = Upfront_DependencyCache_Server::get_instance();

		$dynamic = admin_url('admin-ajax.php?action=upfront_load_editor_grid');
		$link_urls = array(
			$dynamic,
			Upfront::get_root_url() . '/scripts/chosen/chosen.min.css',
			Upfront::get_root_url() . '/styles/font-icons.css',
		);
		$keys = array();
		foreach ($link_urls as $url) {
			$deps->add_style($url);
			$keys[] = $cache->get_key($url);
		}

		$output = $cache->get_resources_output($deps->get_styles());
		$this->assertFalse(
			is_array($output),
			'Raw cached output is NOT an array when we have non-previously-cached dynamic URL resource'
		);

		$status = $cache->set_cached_resource($dynamic, 'Some test content');
		$this->assertTrue(
			$status,
			'Dynamic stub content cache set'
		);

		$output = $cache->get_resources_output($deps->get_styles());
		$this->assertEquals(
			count($link_urls), count($output),
			'Cached all styles successfully, INCLUDING the dynamic URL'
		);

		foreach ($output as $key => $content) {
			$this->assertTrue(
				in_array($key, $keys),
				"Cached content {$key} exists"
			);
		}

		$path = $cache->get_cache_path($deps->get_styles());
		$this->assertTrue(
			file_exists($path),
			'Cache generated from resources and file physically exists'
		);

		$rel = join('/', array(
			Upfront_DependencyCache_Server::CACHE_DIR,
			basename($path)
		));
		$expected = home_url("/wp-content/uploads/{$rel}");
		$actual = $cache->get_cache_url($deps->get_styles());
		$this->assertEquals(
			$actual, $expected,
			"Cache URL matches our expectations"
		);

		// Clean up

		$status = $cache->drop_cached_resource($dynamic);
		$this->assertTrue(
			$status,
			'Dynamic stub cache removed'
		);

		$status = $cache->drop_cache($deps->get_styles());
		$this->assertTrue(
			$status,
			'Cache file dropped'
		);
	}

}
