<?php
/**
 * @group ufc
 */
class UfcTest  extends WP_UnitTestCase {

	private $_ufc;

	public function get_colors_json () {
		return json_encode(array('colors' => $this->get_color_scheme()));
	}

	public function get_color_scheme () {
		return array(
			array('color' => '#ff3333'),
			array('color' => 'rgb(12,42,158)')
		);
	}

	public function get_random_color_strings () {
		$letters = array_merge(
			range('a', 'z'),
			range('A', 'Z'),
			range(0, 9),
			array('/*', '*/', '-', ':', ';', "\n", "\r", "\t")
		);
		$colors = $this->get_color_scheme();
		$sentence = array();
		$idx = 0;
		foreach (range(20, rand(25, 150)) as $wc) {
			$sentence[$idx] = '';
			foreach(range(3, rand(4, 10)) as $lc) {
				$sentence[$idx] .= $letters[array_rand($letters)];
			}
			if (rand(0,1) === 1) $sentence[$idx] .= ' #ufc' . rand(0, count($colors)-1);
			$idx++;
		}
		return join(' ', $sentence);
	}

	public function setUp () {
		add_filter('upfront_get_theme_colors', array($this, 'get_colors_json'));
		$this->_ufc = Upfront_UFC::init();
		remove_filter('upfront_get_theme_colors', array($this, 'get_colors_json'));
	}

	public function test_get_ufc_and_color () {
		$colors = $this->get_color_scheme();

		foreach ($colors as $key => $color) {
			$val = $this->_ufc->get_ufc($color['color']);
			$this->assertEquals(
				"ufc{$key}", $val,
				"Properly decoded color var value"
			);

			$val = $this->_ufc->get_color("ufc{$key}");
			$this->assertEquals(
				$val, $color['color'],
				"Properly decoded var value color"
			);
		}

		$invalid = array(
			'something',
			1234,
			'#000000',
			'rgba(123,43,12,.1)'
		);
		foreach ($invalid as $color) {
			$val = $this->_ufc->get_ufc($color);
			$this->assertFalse($val, "Invalid colors decode to false");
		}

		foreach (range(20,50) as $idx) {
			$val = $this->_ufc->get_color("ufc{$idx}");
			$this->assertFalse($val, "Unknown color var decodes to false");
		}

		$this->assertTrue(true);
	}

	public function test_process_colors () {
		$colors = $this->get_color_scheme();
		foreach (range(1,20) as $idx) {
			$text = $this->get_random_color_strings();
			$proc = $this->_ufc->process_colors($text);
			$expected = $text;
			foreach ($colors as $key => $val) {
				$expected = preg_replace("/#ufc{$key}/", $val['color'], $expected);
			}
			$this->assertNotEquals(
				$text, $proc,
				"Processing actually happened"
			);
			$this->assertEquals(
				$proc, $expected,
				"Successful colors replacement"
			);
		}
	}
}
