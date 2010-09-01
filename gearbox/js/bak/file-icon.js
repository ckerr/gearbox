/**
 * Vaporlock: a Web GUI for Transmission
 * 
 * Copyright (c) Mnemosyne LLC
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 */

Ext.namespace( 'Transmission' );

Transmission.FileIcon = (function(){

    var FILETYPE_UNKNOWN = 0;
    var FILETYPE_DISK    = 1;
    var FILETYPE_TEXT    = 2;
    var FILETYPE_IMAGE   = 3;
    var FILETYPE_VIDEO   = 4;
    var FILETYPE_ARCHIVE = 5;
    var FILETYPE_AUDIO   = 6;
    var FILETYPE_APP     = 7;
    var FILETYPE_FOLDER  = 8;

    var type2img =  [ '{imgroot}/{size}/mimetypes/unknown.png',
                      '{imgroot}/{size}/devices/media-optical.png',
                      '{imgroot}/{size}/mimetypes/text-x-generic.png',
                      '{imgroot}/{size}/mimetypes/image-x-generic.png',
                      '{imgroot}/{size}/mimetypes/video-x-generic.png',
                      '{imgroot}/{size}/mimetypes/package-x-generic.png',
                      '{imgroot}/{size}/mimetypes/audio-x-generic.png',
                      '{imgroot}/{size}/mimetypes/application-x-executable.png',
                      '{imgroot}/{size}/places/folder.png' ];

    function getIconURL( type, iconSize )
    {
        var imgroot = Transmission.imgRoot;
        var size = '' + iconSize + 'x' + iconSize;
        return type2img[type].replace('{imgroot}',imgroot).replace('{size}',size);
    };

    var suffix2type = {
        '3gp'   : FILETYPE_VIDEO,  
        '7z'    : FILETYPE_ARCHIVE,
        'aac'   : FILETYPE_AUDIO, 
        'abw'   : FILETYPE_TEXT, 
        'ac3'   : FILETYPE_AUDIO, 
        'ace'   : FILETYPE_ARCHIVE, 
        'aiff'  : FILETYPE_AUDIO, 
        'ape'   : FILETYPE_AUDIO, 
        'asf'   : FILETYPE_VIDEO,
        'au'    : FILETYPE_AUDIO, 
        'avi'   : FILETYPE_VIDEO,
        'bat'   : FILETYPE_APP,
        'bmp'   : FILETYPE_IMAGE, 
        'bz2'   : FILETYPE_ARCHIVE, 
        'cbz'   : FILETYPE_ARCHIVE, 
        'cmd'   : FILETYPE_APP,
        'com'   : FILETYPE_APP,
        'csv'   : FILETYPE_TEXT, 
        'doc'   : FILETYPE_TEXT, 
        'dvi'   : FILETYPE_TEXT, 
        'exe'   : FILETYPE_APP,
        'flac'  : FILETYPE_AUDIO, 
        'gif'   : FILETYPE_IMAGE, 
        'gzip'  : FILETYPE_ARCHIVE, 
        'gz'    : FILETYPE_ARCHIVE, 
        'html'  : FILETYPE_TEXT, 
        'htm'   : FILETYPE_TEXT, 
        'ini'   : FILETYPE_TEXT, 
        'iso'   : FILETYPE_DISK,
        'jpeg'  : FILETYPE_IMAGE, 
        'jpg'   : FILETYPE_IMAGE, 
        'log'   : FILETYPE_TEXT,
        'lzma'  : FILETYPE_ARCHIVE, 
        'm3u'   : FILETYPE_AUDIO, 
        'm4a'   : FILETYPE_AUDIO,
        'midi'  : FILETYPE_AUDIO, 
        'mid'   : FILETYPE_AUDIO, 
        'mkv'   : FILETYPE_VIDEO,
        'mov'   : FILETYPE_VIDEO,
        'mov'   : FILETYPE_VIDEO,
        'mp2'   : FILETYPE_AUDIO, 
        'mp3'   : FILETYPE_AUDIO, 
        'mp4'   : FILETYPE_VIDEO,
        'mpc'   : FILETYPE_AUDIO, 
        'mpeg'  : FILETYPE_VIDEO,
        'mpg'   : FILETYPE_VIDEO,
        'nsf'   : FILETYPE_AUDIO, 
        'odp'   : FILETYPE_TEXT, 
        'ods'   : FILETYPE_TEXT, 
        'odt'   : FILETYPE_TEXT, 
        'oga'   : FILETYPE_AUDIO, 
        'ogg'   : FILETYPE_AUDIO,
        'ogm'   : FILETYPE_VIDEO,
        'ogv'   : FILETYPE_VIDEO,
        'pcx'   : FILETYPE_IMAGE, 
        'pdf'   : FILETYPE_TEXT, 
        'png'   : FILETYPE_IMAGE, 
        'ppt'   : FILETYPE_TEXT, 
        'psd'   : FILETYPE_IMAGE, 
        'ps'    : FILETYPE_TEXT, 
        'qt'    : FILETYPE_VIDEO,
        'ram'   : FILETYPE_AUDIO, 
        'rar'   : FILETYPE_ARCHIVE,
        'ra'    : FILETYPE_AUDIO, 
        'raw'   : FILETYPE_IMAGE,
        'rm'    : FILETYPE_VIDEO,
        'rtf'   : FILETYPE_TEXT, 
        'sft'   : FILETYPE_ARCHIVE, 
        'shn'   : FILETYPE_AUDIO, 
        'tar'   : FILETYPE_ARCHIVE, 
        'tex'   : FILETYPE_TEXT,
        'tga'   : FILETYPE_IMAGE, 
        'tiff'  : FILETYPE_IMAGE,
        'txt'   : FILETYPE_TEXT, 
        'voc'   : FILETYPE_AUDIO, 
        'wav'   : FILETYPE_AUDIO, 
        'wma'   : FILETYPE_AUDIO,
        'wmv'   : FILETYPE_VIDEO,
        'xml'   : FILETYPE_TEXT,
        'xz'    : FILETYPE_ARCHIVE,
        'zip'   : FILETYPE_ARCHIVE
    };

    return {
        SMALL: 16,
        LARGE: 32,
        getIcon: function( filename, iconSize ) {
            var suffix = filename.slice( filename.lastIndexOf('.') + 1 );
            var type = suffix2type[suffix];
            return getIconURL( type ? type : FILETYPE_UNKNOWN, iconSize );
        },
        getFolderIcon: function( iconSize ) {
            return getIconURL( FILETYPE_FOLDER, iconSize );
        },
        getGenricIcon: function( iconSize ) {
            return getIconURL( FILETYPE_UNKNOWN, iconSize );
        }
    };
})();
