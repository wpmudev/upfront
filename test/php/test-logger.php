<?php
/**
 * @group logs
 */
class LoggerTest  extends WP_UnitTestCase {

	public function test_hierarchy () {
		$this->assertTrue(
			class_exists('Upfront_Logger'),
			'Abstraction root class exists'
		);

		$this->assertTrue(
			class_exists('Upfront_Logger_Fs'),
			'FS writer class exists'
		);
		$this->assertTrue(
			class_exists('Upfront_Logger_Stream'),
			'Stream writer class exists'
		);

		$fs = new Upfront_Logger_Fs;
		$this->assertTrue(
			$fs instanceof Upfront_Logger,
			'FS writer is a child of root logger'
		);
		$stream = new Upfront_Logger_Stream;
		$this->assertTrue(
			$stream instanceof Upfront_Logger,
			'Stream writer is a child of root logger'
		);
	}

	public function test_factory () {
		$default_class = Upfront_Log::get_default_logger();
		$this->assertTrue(
			Upfront_Log::get() instanceof $default_class,
			'Log object getting without parameter returns default object'
		);
		$this->assertEquals(
			$default_class, 'Upfront_Logger_Fs',
			'Default class is FS logger'
		);

		$fs = Upfront_Log::get(Upfront_Log::FS);
		$this->assertTrue(
			$fs instanceof Upfront_Logger_Fs,
			'Getting FS logger from explicit constant works'
		);

		$stream = Upfront_Log::get(Upfront_Log::STREAM);
		$this->assertTrue(
			$stream instanceof Upfront_Logger_Stream,
			'Getting stream logger from explicit constant works'
		);

		$section = 'test section';
		$sectioned = Upfront_Log::get(false, $section);
		$this->assertTrue(
			$sectioned instanceof $default_class,
			'Sectioned default logger object is default class instance'
		);
		$this->assertEquals(
			$sectioned->get_section(), $section,
			'Section info properly applied'
		);
	}

	public function test_levels () {
		$obj = Upfront_Log::get();

		$this->assertEquals(
			Upfront_Logger::LVL_INFO, $obj->get_default_level(),
			'Default log level is info'
		);
		$this->assertEquals(
			Upfront_Logger::LVL_NOTICE, $obj->get_active_level(),
			'Default active level is notice'
		);

		$this->assertEquals(
			$obj->get_default_level(), $obj->get_level('xczv'),
			'Level getting gets normalized to default level'
		);

		$this->assertTrue(
			$obj->is_loggable_level(Upfront_Logger::LVL_WARNING),
			'With default setup, warning is a loggable level'
		);
		$this->assertTrue(
			$obj->is_loggable_level(Upfront_Logger::LVL_NOTICE),
			'With default setup, notice is a loggable level'
		);
		$this->assertFalse(
			$obj->is_loggable_level(Upfront_Logger::LVL_INFO),
			'With default setup, info is NOT a loggable level'
		);

		$obj->set_log_level(Upfront_Logger::LVL_ERROR);
		$this->assertEquals(
			Upfront_Logger::LVL_ERROR, $obj->get_active_level(),
			'Current active level is error'
		);
		$this->assertTrue(
			$obj->is_loggable_level(Upfront_Logger::LVL_ERROR),
			'Error is currently loggable'
		);
		$this->assertFalse(
			$obj->is_loggable_level(Upfront_Logger::LVL_WARNING),
			'Warning is currently not loggable'
		);
		$this->assertFalse(
			$obj->is_loggable_level(Upfront_Logger::LVL_NOTICE),
			'Notice is currently not loggable'
		);
		$this->assertFalse(
			$obj->is_loggable_level(Upfront_Logger::LVL_INFO),
			'Info is currently not loggable'
		);
	}

	public function test_logging () {
		$msg = 'Test message used for testing';
		$section = 'Test section';
		$obj = new Upfront_Logger_Stack($section);

		$obj->error($msg);
		$this->assertTrue(
			!empty($obj->stack[Upfront_Logger::LVL_ERROR]),
			'Error properly queued'
		);
		$this->assertTrue(
			!!preg_match('/' . preg_quote("[{$section}]", '/') . '/', $obj->stack[Upfront_Logger::LVL_ERROR]),
			'Section info is in message format'
		);
		$label = $obj->get_level_name(Upfront_Logger::LVL_ERROR);
		$this->assertTrue(
			!!preg_match('/' . preg_quote("[{$label}]", '/') . '/', $obj->stack[Upfront_Logger::LVL_ERROR]),
			'Level label info is in message format'
		);
		$this->assertTrue(
			!!preg_match('/' . preg_quote($msg, '/') . '/', $obj->stack[Upfront_Logger::LVL_ERROR]),
			'Message is preserved in message format'
		);

		$obj->warn($msg);
		$this->assertTrue(
			!empty($obj->stack[Upfront_Logger::LVL_WARNING]),
			'Warning properly queued'
		);
		$obj->notice($msg);
		$this->assertTrue(
			!empty($obj->stack[Upfront_Logger::LVL_NOTICE]),
			'Notice properly queued'
		);
		$status = $obj->info($msg);
		$this->assertFalse(
			!empty($obj->stack[Upfront_Logger::LVL_INFO]),
			'Info properly rejected from queue'
		);
		$this->assertFalse(
			$status,
			'Rejection properly reflected in return status'
		);
	}
}


class Upfront_Logger_Stack extends Upfront_Logger {

	public $stack = array();

	public function log ($msg, $level=false) {
		if (!$this->is_loggable_level($level)) return false;
		$this->stack[$this->get_level($level)] = $this->format_message($msg, $level);
	}
}


