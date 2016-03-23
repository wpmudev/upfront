<div class="ueditor-insert upfront-inserted_image-wrapper ueditor-insert-variant ueditor-post-image-insert nosortable" id="<?php echo $data->id; ?>" style="margin-left: <?php echo $style->marginLeft; ?>; margin-right: <?php echo $style->marginRight; ?>;">
	<div data-variant="<?php echo $data->uf_variant ?>" class="ueditor-insert ueditor-insert-variant-group <?php echo $style->label_id; ?> ueditor-insert-float-<?php echo $style->group->float; ?> <?php echo $style->group->width_cls ?>" style="min-height: <?php echo $style->group->height; ?>px;float:<?php echo $style->group->float; ?>; <?php if( $style->group->marginRight > 0 ) { ?>margin-right:<?php echo $style->group->marginRight; ?>px;<?php } ?> <?php if( $style->group->marginLeft > 0 ){ ?>margin-left:<?php echo $style->group->marginLeft ?>px;<?php } ?>" >

		<?php  if( $style->caption->order == 0 && $data->uf_show_caption): ?>
		<div class="upfront-wrapper wp-caption-text <?php echo $style->caption->width_cls; ?>" style="min-height:<?php echo $style->caption->height; ?>px"><?php echo $data->caption ?></div>
		<?php endif; ?>

		<div class="upfront-wrapper uinsert-image-wrapper <?php echo $style->image->width_cls; ?> <?php  if(!$data->uf_isLocal): ?>uinsert-image-external<?php endif; ?>" style="min-height: <?php echo $style->image->height; ?>px;"><?php if( !empty( $data->linkUrl ) ){ ?><a href="<?php echo $data->linkUrl;?>"> <?php } ?><img class="" src="<?php echo $data->image; ?>" /><?php if( !empty($data->linkUrl) ){ ?> </a><?php } ?></div>

		<?php  if( $style->caption->order == 1 && $data->uf_show_caption): ?>
		<div class="upfront-wrapper wp-caption-text <?php echo $style->caption->width_cls; ?> " style="min-height:<?php echo $style->caption->height; ?>px"><?php echo $data->caption ?></div>
		<?php endif; ?>

		<div style="clear:both;"></div>

	</div>
</div>