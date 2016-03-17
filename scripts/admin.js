(function($){
    Upfront = {
        post: function( data, data_type ){
            return $.post( ajaxurl, data, function () {}, data_type ? data_type : "json");
        }
    };

    /**
     * General page
     *
     */

    // Reset Upfront cache
    $(document).on("click", "#upfront_reset_cache", function(e){
        e.preventDefault();

        $this = $(this);
        $this.addClass("loading");

        Upfront.post(  {
            action: "upfront_reset_cache"
        }).done(function(res){
            $this.removeClass("loading");
        }).fail( function(res){
            $this.removeClass("loading");
        } );

    });

    /**
     * Reset layout
     */
    $(document).on("click", "#upfront_reset_layout", function(e){
        e.preventDefault();

        $this = $(this);
        $this.addClass("loading");

        Upfront.post(  {
            action: "upfront_reset_layout",
            layout: $(".upfront-layouts-list").val()
        }).done(function(res){
            $this.removeClass("loading");
        }).fail( function(res){
            $this.removeClass("loading");
        } );

    });

    /**
     * Reset theme
     */
    $(document).on("click", "#upfront_reset_theme", function(e){
        e.preventDefault();

        $this = $(this);
        $this.addClass("loading");

        if(!confirm("Hi there")) return;

        Upfront.post(  {
            action: "upfront_reset_all_from_db"
        }).done(function(res){
            $this.removeClass("loading");
        }).fail( function(res){
            $this.removeClass("loading");
        } );

    })
}(jQuery));