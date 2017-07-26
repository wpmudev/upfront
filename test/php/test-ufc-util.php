<?php
/**
 * @group ufc
 */
class UfcUtilTest  extends WP_UnitTestCase {

	public function test_class_exists () {
		$this->assertTrue(
			class_exists('Upfront_UFC_Utils'),
			"Theme color variables utilities class loaded"
		);
	}

	public function test_is_hex () {
		$t = new Upfront_UFC_Utils;
		$valid = array(
			'#fafafa',
			'fff',
			'345bfa',
			12345
		);

		foreach ($valid as $test) {
			$this->assertTrue(
				$t->is_hex($test),
				"Valid hexadecimal value: {$test}"
			);
		}

		$invalid = array(
			'ttt',
			'xn09eg'
		);

		foreach ($invalid as $test) {
			$this->assertFalse(
				$t->is_hex($test),
				"Invalid hexadecimal value: {$test}"
			);
		}
	}

	public function test_is_rgb () {
		$t = new Upfront_UFC_Utils;

		$valid = array(
			'rgb(2,32,16)',
			'rgb( 122, 198, 255)'
		);
		foreach ($valid as $test) {
			$this->assertTrue(
				$t->is_rgb($test),
				"Valid RBG format: {$test}"
			);
		}

		$invalid = array(
			'#fff',
			'fafafa',
			'rgb(800,964, 1)',
			'rgba(80,94, 1,.6)',
			323,
			'something'
		);
		foreach ($invalid as $test) {
			$this->assertFalse(
				$t->is_rgb($test),
				"Invalid RGB format: {$test}"
			);
		}
	}

	public function test_is_rgba () {
		$t = new Upfront_UFC_Utils;

		$valid = array(
			'rgba(12,12,12,.6)',
			'rgba(142, 86, 32, .1)'
		);
		foreach ($valid as $test) {
			$this->assertTrue(
				$t->is_rgba($test),
				"Valid RGBA format: {$test}"
			);
		}

		$invalid = array(
			'rgba(1024,843,324,.15)',
			'rgb(12,32,18)',
			'rgba(12,32,18,124)',
			'something',
			'#fff',
			'fafafa'
		);
		foreach ($invalid as $test) {
			$this->assertFalse(
				$t->is_rgba($test),
				"Invalid RGBA format: {$test}"
			);
		}
	}

	public function test_hex_to_rgb () {
		$t = new Upfront_UFC_Utils;
		$checks = array(
			'#fff' => '(255,255,255)',
			'f00' => '(255,0,0)',
			// Weird function signature
			'something' => 'something',
			'#fa' => false,
		);

		foreach ($checks as $test => $check) {
			$this->assertEquals(
				$t->hex2rgb($test), $check,
				"Successfuly converted {$test} to RGB"
			);
		}
	}

}
