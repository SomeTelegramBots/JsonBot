'use strict';
const { Telegraf } = require('telegraf');
const mediaGroup = require('./telegraf_media_group.js');
const fastChunkString = require('@shelf/fast-chunk-string');

// #region InternalConstants

const SubTypes = [
	"text",
	"voice",
	"video_note",
	"video",
	"animation",
	"sticker",
	"photo",
	"document",
	"audio",
	"forward",
];

const	eSubTypes_Text		=	0,
		eSubTypes_Voice		=	1,
		eSubTypes_VideoNote	=	2,
		eSubTypes_Video		=	3,
		eSubTypes_Animation	=	4,
		eSubTypes_Sticker	=	5,
		eSubTypes_Photo		=	6,
		eSubTypes_Document	=	7,
		eSubTypes_Audio		=	8,
		eSubTypes_Forward	=	9;

// #endregion InternalConstants


const messageLimitBytes = 4096;
const messageLimitBytesChunk = messageLimitBytes - 1;

const botToken = '*:*';

const __botToken = botToken || process.env.token;

const bot = new Telegraf(__botToken);

bot.use(mediaGroup());

const g_ExtObj = Object.freeze({ str: '' });

const chunkCfg = {
	size: messageLimitBytesChunk,
	unicodeAware: true
};

let getFileUrl = async function (ctx, fileCtx) {
	let result = undefined;

	try {
		result = await ctx.telegram.getFileLink(fileCtx.file_id);
	}
	catch(e) {
		result = null;
	}

	return result;
}
require("util").inspect.defaultOptions.depth = null;
const parseMessages = async function (ctx, messageObject, extObj) {
	try {
		let __msg = messageObject || ctx.message;

		let __updateSubType = messageObject ? messageObject.updateSubTypes[0] : ctx.updateSubTypes[0];

		if(ctx.updateSubTypes.includes(SubTypes[eSubTypes_Forward])) extObj.str += '\nForwarded message\n';

		let __subTypeArrIndex = SubTypes.indexOf(__updateSubType);

		switch(__subTypeArrIndex) {
			case eSubTypes_Text: {
				break;
			}

			case eSubTypes_Photo: {
				let photoIndex = __msg.photo.length - 1;

				let result = await getFileUrl(ctx, __msg.photo[photoIndex]);

				if(result) {
					extObj.str += 'Single picture, url: ' + result + '\n\n ';
				}

				break;
			}

			case eSubTypes_Document: {
				let result = await getFileUrl(ctx, __msg.document);

				if(result) {
					extObj.str += 'Document, url: ' + result + '\n\n ';
				}

				break;
			}

			case eSubTypes_Voice: {
				let result = await getFileUrl(ctx, __msg.voice);

				if(result) {
					extObj.str += `Voice message (${__msg.voice.duration}s.), url: ` + result + '\n\n ';
				}

				break;
			}

			case eSubTypes_VideoNote: {
				let result = await getFileUrl(ctx, __msg.video_note);

				if(result) {
					extObj.str += `Video message (${__msg.video_note.duration}s.), url: ` + result + '\n\n ';
				}

				break;
			}

			case eSubTypes_Video: {
				let result = await getFileUrl(ctx, __msg.video);

				if(result) {
					extObj.str += `Single video (${__msg.video.duration}s.), url: ` + result + '\n\n ';
				}

				break;
			}

			case eSubTypes_Animation: {
				let result = await getFileUrl(ctx, __msg.animation);

				if(result) {
					extObj.str += `Animation (${__msg.animation.duration}s.), url: ` + result + '\n\n ';
				}

				break;
			}

			case eSubTypes_Sticker: {
				let result = await getFileUrl(ctx, __msg.sticker);

				if(result) {
					extObj.str += `Sticker, url: ` + result + '\n\n ';
				}

				break;
			}

			case eSubTypes_Audio: {
				let result = await getFileUrl(ctx, __msg.audio);

				if(result) {
					extObj.str += `Audio (${__msg.audio.duration}s.), url: ` + result + '\n\n ';
				}

				break;
			}

		}
	}
	catch(err) {
		console.log("err is", err);
	}
}

/*
bot.hears('!ban', async (ctx) => {
	await ctx.kickChatMember(276700794)
});
*/

bot.on('media_group', async (ctx) => {
	try {
		let __ExtObj = Object.assign({}, g_ExtObj); // or spread, whatever

		for (const message of ctx.mediaGroup) {
			await parseMessages(ctx, message, __ExtObj);
		}

		__ExtObj.str += `updateType: ${ctx.updateType} updateType: ${JSON.stringify(ctx.updateSubTypes)}\ninfo:`;

		let answerOptions = { reply_to_message_id: ctx.mediaGroup[0].message_id };

		let lastMessage = await ctx.replyWithHTML(__ExtObj.str, answerOptions);
		answerOptions.reply_to_message_id = lastMessage.message_id;

		let arr = fastChunkString(JSON.stringify(ctx.mediaGroup, null, 1), chunkCfg);

		let tempStr = undefined;
		for(let i = 0, l = arr.length; i < l; i++) {
			tempStr = '<pre>'+`${arr[i]}`+'</pre>';
			lastMessage = await ctx.replyWithHTML(tempStr, answerOptions);
			answerOptions.reply_to_message_id = lastMessage.message_id;
			tempStr = undefined;
		}

		arr = undefined;
		lastMessage = undefined;
		answerOptions = undefined;
		__ExtObj = undefined;
	}
	catch(err) {
		console.log("err is", err);
	}

	return true;
});

bot.on('message', async (ctx) => {
	try {
		let __ExtObj = Object.assign({}, g_ExtObj); // or spread, whatever

		await parseMessages(ctx, undefined, __ExtObj);

		__ExtObj.str += `updateType: ${ctx.updateType} updateType: ${JSON.stringify(ctx.updateSubTypes)}\ninfo:`;

		let answerOptions = { reply_to_message_id: ctx.message.message_id };
		
		let lastMessage = await ctx.replyWithHTML(__ExtObj.str, answerOptions);
		answerOptions.reply_to_message_id = lastMessage.message_id;

		let arr = fastChunkString(JSON.stringify(ctx.message, null, 1), chunkCfg);

		let tempStr = undefined;
		for(let i = 0, l = arr.length; i < l; i++) {
			tempStr = '<pre>'+`${arr[i]}`+'</pre>';
			lastMessage = await ctx.replyWithHTML(tempStr, answerOptions);
			answerOptions.reply_to_message_id = lastMessage.message_id;
			tempStr = undefined;
		}

		arr = undefined;
		lastMessage = undefined;
		answerOptions = undefined;
		__ExtObj = undefined;
	}
	catch(err) {
		console.log("err is", err);
	}
});


bot.launch();
