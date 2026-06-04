<?php
/**
 * The Super 7 theme functions.
 *
 * @package the-super-7
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // No direct access.
}

/**
 * Theme setup.
 */
function the_super_7_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption', 'style', 'script' ) );

	register_nav_menus(
		array(
			'primary' => __( 'Primary Menu', 'the-super-7' ),
		)
	);
}
add_action( 'after_setup_theme', 'the_super_7_setup' );

/**
 * Enqueue styles and scripts.
 */
function the_super_7_assets() {
	// Google Fonts.
	wp_enqueue_style(
		'the-super-7-fonts',
		'https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800&display=swap',
		array(),
		null
	);

	// Main stylesheet (the theme's style.css, which holds the tokens + all styles).
	wp_enqueue_style(
		'the-super-7-style',
		get_stylesheet_uri(),
		array( 'the-super-7-fonts' ),
		wp_get_theme()->get( 'Version' )
	);

	// Interactive prediction demo.
	wp_enqueue_script(
		'the-super-7-app',
		get_template_directory_uri() . '/js/app.js',
		array(),
		wp_get_theme()->get( 'Version' ),
		true
	);
}
add_action( 'wp_enqueue_scripts', 'the_super_7_assets' );

/**
 * Output the logo as the browser favicon if the user hasn't set a Site Icon.
 */
function the_super_7_favicon() {
	if ( has_site_icon() ) {
		return;
	}
	$icon = esc_url( get_template_directory_uri() . '/brand/assets/logo.png' );
	echo '<link rel="icon" href="' . $icon . '" type="image/png" />' . "\n";
}
add_action( 'wp_head', 'the_super_7_favicon' );
