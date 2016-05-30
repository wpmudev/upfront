<?php

class Upfront_Uwidget_WP_Defaults
{

    function __construct()
    {
        add_filter("get_calendar", array($this, "remove_id_from_calendar_output"));
    }

    /**
     * Replaces all the id's from get_calendar function output with equivalent classes
     *
     * @param $output
     * @return mixed
     */
    function remove_id_from_calendar_output( $output ){
        return str_replace(
            array('id="wp-calendar"', 'id="prev" class="pad"', 'id="next" class="pad"', 'id="next"', 'id="prev"'),
            array('class="wp-calendar"', 'class="prev pad"', 'class="next pad"', 'class="next"', 'class="prev"'),
            $output
        );
    }

    /**
     * Sets  WP_Widget_Calendar::$instance to 1 to prevent this widget from adding css id
     *
     *
     * @param WP_Widget_Calendar $callback
     * @return void|WP_Widget_Calendar
     */
    public static function increment_calendar_widget_instance(WP_Widget_Calendar $callback ){
        if( !class_exists( "ReflectionClass" ) ) return;

        $reflected = new ReflectionClass( $callback );
        $property = $reflected->getProperty( "instance" );
        $property->setAccessible( true );
        $property->setValue( null, 1 );

        return $callback;
    }
}