const {Composer} = require('telegraf')

const map = new Map()

module.exports = (timeout = 100) => Composer.mount(['photo', 'video', 'document'], (ctx, next) => {
  const message = ctx.message || ctx.channelPost
  if (!message.media_group_id) {
    return next()
  }

  if (!map.get(ctx.chat.id)) {
    map.set(ctx.chat.id, new Map())
  }
  const userMap = map.get(ctx.chat.id)
  if (!userMap.get(message.media_group_id)) {
    userMap.set(message.media_group_id, {
      resolve: () => {},
      messages: [],
	  updateSubTypesCtx: [],
	  /* updateSubTypes: [], */
    })
  }
  const mediaGroupOptions = userMap.get(message.media_group_id)

  mediaGroupOptions.resolve(false)
  // save additional array inside mediaGroup which gonna contain ordered media types
  /* mediaGroupOptions.updateSubTypes.push(ctx.updateSubTypes.slice()); */

  // save updateSubTypes from given context
  message.updateSubTypes = ctx.updateSubTypes.slice();
  mediaGroupOptions.messages.push(message);
  
  // Store all possible types of media that exists in given media group
  if(!mediaGroupOptions.updateSubTypesCtx.includes(ctx.updateSubTypes[0])) {
	  mediaGroupOptions.updateSubTypesCtx.push(ctx.updateSubTypes[0]);
  }

  return new Promise((resolve) => {
    mediaGroupOptions.resolve = resolve
    setTimeout(() => resolve(true), timeout)
  })
    .then((value) => {
      if (value === true) {
        ctx.mediaGroup = mediaGroupOptions.messages.slice().sort((a, b) => a.message_id - b.message_id);
		// save additional array inside mediaGroup which gonna contain ordered media types
		/* ctx.mediaGroup.updateSubTypes = mediaGroupOptions.updateSubTypes.slice(); */
		// save updateSubTypes from given context
		ctx.updateSubTypes = mediaGroupOptions.updateSubTypesCtx.slice();
 
		ctx.updateSubTypes.push('media_group');
		
        userMap.delete(message.media_group_id)
        if (userMap.size === 0) {
          map.delete(ctx.chat.id)
        }
        return next()
      }
    })
})
