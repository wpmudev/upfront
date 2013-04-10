<?php
/**
 * Template Name: Forms test
 */
get_header();
?>
<style type="text/css">
.upfront-edit_layout {
	display:none;
}
</style>
<?php
$form = upfront_form("my-form", "POST", array(
	upfront_username("my-username", "Please enter your username"),
	upfront_email("my-email", "Please enter your email", "local_user@local.loc"),
	upfront_password("my-password", "Please enter your password", "Repeat your password"),
));
if ($form->is_valid()) {
	echo '<h1>Thanks, this was great</h1>';
	// save data etc
	echo '<pre>' . var_export($form->get_value(),1) . '</pre>';
} else {
	echo $form->get_markup();
}

get_footer();