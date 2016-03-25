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
    $(document).on("change", ".upfront-layouts-list", function(e){
        $button = $("#upfront_reset_layout");
        if( $(this).val() === "0"  )
            $button.attr("disabled", true);
        else
            $button.attr("disabled", false);
    });

    $(document).on("click", "#upfront_reset_layout", function(e){
        e.preventDefault();

        var $this = $(this),
            $dropdown = $(".upfront-layouts-list"),
            layout = $dropdown.val(),
            label = $(".upfront-layouts-list option[value='"+  layout +"']").html(),
            confirm = window.confirm( Upfront_Data.l10n.sure_to_reset_layout.replace("{layout}", label) );

        if( confirm !== true ) return;

        $this.addClass("loading");

        Upfront.post(  {
            action: "upfront_reset_layout",
            layout: layout
        }).done(function(res){
            $this.removeClass("loading");
            if( $dropdown.find("option").length === 2 ){
                $dropdown.find("option[value="+ layout + "]").remove();
                $dropdown.val( 0 );
                $this.attr("disabled", true);
            }
        }).fail( function(res){
            $this.removeClass("loading");
        } );

    });

    /**
     * Reset theme
     */
    $(document).on("click", "#upfront_reset_theme", function(e){
        e.preventDefault();

        var $this = $(this),
            confirm = window.confirm( Upfront_Data.l10n.sure_to_reset_theme );

        if( confirm !== true ) return;

        $this.addClass("loading");

        Upfront.post(  {
            action: "upfront_reset_all_from_db"
        }).done(function(res){
            $this.removeClass("loading");
        }).fail( function(res){
            $this.removeClass("loading");
        } );

    })
}(jQuery));