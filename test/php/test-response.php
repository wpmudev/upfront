<?php

class ResponseTest extends WP_UnitTestCase {

	public function test_instance () {
		$resp = new Upfront_JsonResponse_Success("test");
		$this->assertTrue($resp instanceof Upfront_HttpResponse);
		$this->assertTrue($resp instanceof Upfront_HttpResponse_SUccess);

	}

	public function test_get_fallback_signature () {
		$resp = new Upfront_JsonResponse_Success("test");
		$subject = serialize($resp);
		$test = function_exists('sha1')
			? sha1($subject)
			: (function_exists('md5') ? md5($subject) : false)
		;
		$this->assertSame($test, $resp->get_fallback_signature());
	}

	public function test_get_algo () {
		$algos = array('sha512', 'sha256', 'sha1', 'md5', 'garbage');

		foreach ($algos as $test) {
			$resp = new Upfront_JsonResponse_Success("test");
			$expected = 'garbage' === $test ? 'sha512' : $test;
			$this->assertSame(
				$expected,
				$resp->get_signature_algo($test),
				"Matching {$test}: {$expected}"
			);
		}
	}

	public function test_get_signature () {
		$algos = array('sha512', 'sha256', 'sha1', 'md5', 'garbage');

		foreach ($algos as $test) {
			$resp = new Upfront_JsonResponse_Success("test");
			$algo = $resp->get_signature_algo($test);
			$expected = hash_hmac($algo, serialize($resp), $algo);
			$actual = $resp->get_signature($test);

			$this->assertSame($expected, $actual);
		}
	}

}
