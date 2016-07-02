<?php

class Upfront_Admin_ApiKeys extends Upfront_Admin_Page {

	const FORM_NONCE_KEY = 'upfront_apikeys_wpnonce';
	const FORM_NONCE_ACTION = 'upfront_apikeys_save';

	private $_model;

	public function __construct () {
		parent::__construct();
		$this->_model = new Upfront_ApiKeys_Model;
	}

	public function render_page () {
		// yeah...
	}

	/**
	 * Processes POST submissions
	 *
	 * @return bool
	 */
	public function process_submissions () {
		$data = stripslashes_deep($_POST);

		if (empty($data)) return false;
		if (!$this->can_access()) return false;

		$services = $this->get_services();
		$result = array();
		foreach ($services as $service => $label) {
			if (!wp_verify_nonce($_POST[self::FORM_NONCE_KEY . $service], self::FORM_NONCE_ACTION . $service)) continue;
			$key = trim($data['api-keys'][$service]);
			$result[$service] = !empty($key)
				? $key
				: false
			;
		}
		$result = array_filter(array_unique($result));
		$status = $this->_model->set_all($result)
			? 'success'
			: 'failure'
		;
	}

	/**
	 * Known services getter
	 *
	 * @return array
	 */
	 public function get_services () {
 		return array(
 			Upfront_ApiKeys_Model::SERVICE_GMAPS => array(
				'label' => __('Google Maps', 'upfront'),
				'help' => sprintf(
					__('You can obtain the API key <a href="%s" target="_blank">here</a>', 'upfront'),
					'https://console.developers.google.com/flows/enableapi?apiid=maps_backend,geocoding_backend,directions_backend,distance_matrix_backend,elevation_backend&keyType=CLIENT_SIDE&reusekey=true'
				),
			),
 		);
 	}

	/**
	 * Access protection abstraction
	 *
	 * @return bool
	 */
	public function can_access () {
		return $this->_can_access(Upfront_Permissions::MODIFY_RESTRICTIONS);
	}

	/**
	 * Renders service key entry box
	 *
	 * @param string $service Known service index key
	 */
	public function render_key_box ($service=false) {
		$services = $this->get_services();
		if (!in_array($service, array_keys($services))) return false;

		$value = $this->_model->get($service);

		?>
<div class="api key <?php echo sanitize_html_class($service); ?>">
	<p>
		<label for="api-key-<?php echo esc_attr($service); ?>">
			<span class="label"><?php echo esc_html($services[$service]['label']); ?></span>
			<input
				type="text" name="api-keys[<?php echo esc_attr($service); ?>]" id="api-key-<?php echo esc_attr($service); ?>"
				value="<?php echo esc_attr($value); ?>"
			/>
			<?php wp_nonce_field(self::FORM_NONCE_ACTION . $service, self::FORM_NONCE_KEY . $service); ?>
		<?php if (!empty($services[$service]['help'])) { ?>
			<span class="help"><?php echo $services[$service]['help']; ?></span>
		<?php } ?>
		</label>
	</p>
</div>
		<?php
	}



}
