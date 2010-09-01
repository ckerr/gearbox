/**
 * Gearbox: a Web GUI for Transmission
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

Transmission.FILETYPE_UNKNOWN = 0;
Transmission.FILETYPE_DISK    = 1;
Transmission.FILETYPE_TEXT    = 2;
Transmission.FILETYPE_IMAGE   = 3;
Transmission.FILETYPE_VIDEO   = 4;
Transmission.FILETYPE_ARCHIVE = 5;
Transmission.FILETYPE_AUDIO   = 6;
Transmission.FILETYPE_APP     = 7;
Transmission.FILETYPE_FOLDER  = 8;

TorrentView = Ext.extend( Ext.grid.GridPanel,
{
    isCompact: false,
    iconSize: Transmission.FileIcon.LARGE,

    getIcon: function( tor )
    {
        if( tor.files.length == 0 )
            return Transmission.FileIcon.getGenericIcon( this.iconSize );
        else if( tor.files.length == 1 )
            return Transmission.FileIcon.getIcon( tor.files[0].name, this.iconSize );
        else
            return Transmission.FileIcon.getFolderIcon( this.iconSize );
    },

    getProgressString: function( rec, tor )
    {
        var isMagnet = rec.isMagnet( );
        var isDone = rec.isDone( );
        var isSeed = rec.isSeed( );
        var seedRatio;
        var hasSeedRatio = false;//FIXME tor.getSeedRatio( seedRatio );
        var str;

        if( isMagnet ) // magnet link with no metadata
        {
            // %1 is the percentage of torrent metadata downloaded
            str = String.format( "Magnetized transfer - retrieving metadata {0}%)",
                                 Transmission.fmt.percentString( tor.metadataPercentDone() * 100.0 ) );
        }
        else if( !isDone ) // downloading
        {
            // %1 is how much we've got,
            // %2 is how much we'll have when done,
            // %3 is a percentage of the two
            str = String.format( "{0} of {1} ({2}%)",
                    Transmission.fmt.size( rec.haveTotal( ) ),
                    Transmission.fmt.size( rec.sizeWhenDone( ) ),
                    Transmission.fmt.percentString( rec.percentDone() * 100.0 ) );
        }
        else if( !isSeed ) // partial seed
        {
            if( hasSeedRatio )
            {
                // %1 is how much we've got,
                // %2 is the torrent's total size,
                // %3 is a percentage of the two,
                // %4 is how much we've uploaded,
                // %5 is our upload-to-download ratio
                // %6 is the ratio we want to reach before we stop uploading
                str = String.format( "{0} of {1} ({2}%), uploaded {3} (Ratio: {4} Goal: {5})",
                        Transmission.fmt.size( rec.haveTotal() ),
                        Transmission.fmt.size( rec.totalSize() ),
                        Transmission.fmt.percentString( rec.percentComplete( ) ),
                        Transmission.fmt.size( rec.uploadedEver( ) ),
                        Transmission.fmt.ratioString( rec.uploadRatio() ),
                        Transmission.fmt.ratioString( seedRatio ) );
            }
            else
            {
                // %1 is how much we've got,
                // %2 is the torrent's total size,
                // %3 is a percentage of the two,
                // %4 is how much we've uploaded,
                // %5 is our upload-to-download ratio
                str = String.format( "{0} of {1} ({2}%), uploaded {3} (Ratio: {4})",
                        Transmission.fmt.size( rec.haveTotal ),
                        Transmission.fmt.size( rec.totalSize( ) ),
                        Transmission.fmt.percentString( rec.percentComplete( ) ),
                        Transmission.fmt.size( rec.uploadedEver( ) ),
                        Transmission.fmt.ratioString( rec.uploadRatio( ) ) );
            }
        }
        else // seeding
        {
            if( hasSeedRatio )
            {
                // %1 is the torrent's total size,
                // %2 is how much we've uploaded,
                // %3 is our upload-to-download ratio,
                // %4 is the ratio we want to reach before we stop uploading
                str = String.format( "{0}, uploaded {1} (Ratio: {2} Goal {3})",
                        Transmission.fmt.size( rec.haveTotal( ) ),
                        Transmission.fmt.size( rec.uploadedEver( ) ),
                        Transmission.fmt.ratioString( rec.uploadRatio( ) ),
                        Transmission.fmt.ratioString( seedRatio ) );
            }
            else // seeding w/o a ratio
            {
                // %1 is the torrent's total size,
                // %2 is how much we've uploaded,
                // %3 is our upload-to-download ratio
                str = String.format( "{0}, uploaded {1} (Ratio: {2})",
                        Transmission.fmt.size( rec.haveTotal( ) ),
                        Transmission.fmt.size( rec.uploadedEver() ),
                        Transmission.fmt.ratioString( rec.uploadRatio() ) );
            }
        }

        // add time when downloading
        if( ( rec.isSeeding() && hasSeedRatio ) || rec.isDownloading() )
        {
            str += ' - ';

            if( rec.hasETA() )
                str += String.format( '{0} left', Transmission.fmt.timeInterval( rec.getETA( ) ) );
            else
                str += 'Remaining time unknown';
        }

        return str;
    },

    shortTransferString: function( tor )
    {
        var str;
        var isMagnet = tor.metadataPercentDone < 1;
        var haveDown = !isMagnet && (tor.peersSendingToUs>0);
        var haveUp = !isMagnet && (tor.peersGettingFromUs>0);
        var downStr, upStr;

        if( haveDown )
            downStr = Transmission.fmt.speed( tor.rateDownload );
        if( haveUp )
            upStr = Transmission.fmt.speed( tor.rateUpload );

        if( haveDown && haveUp )
            str = String.format( '&darr; {0}, &uarr; {1}', downStr, upStr );
        else if( haveDown )
            str = String.format( '&darr; {0}', downStr );
        else if( haveUp )
            str = String.format( '&uarr; {0}', upStr );
        else if( !isMagnet )
            str = 'Idle';

        return str;
    },

    getShortStatusString: function( tor )
    {
        var str;

        switch( tor.status )
        {
            case Torrent.STATUS_CHECK:
                str = String.format( 'Verifying local data ({0}% tested)', Transmission.fmt.percentString( tor.recheckProgress * 100.0 ) );
                break;

            case Torrent.STATUS_DOWNLOAD:
            case Torrent.STATUS_SEED:
                if( !Torrent.isDownloading(tor) )
                    str = String.format( 'Ratio: {0}, ', Transmission.fmt,ratioString( tor.uploadRatio ) );
                str += this.shortTransferString( tor );
                break;

            default:
                str = tor.getActivityString( );
                break;
        }

        return str;
    },

    getStatusString: function( rec, tor )
    {
        var str;

        if( tor.error && ( tor.error.length > 0 ) )
        {
            str = tor.error;
        }
        else switch( tor.status )
        {
            case Torrent.STATUS_STOPPED:
            case Torrent.STATUS_CHECK_WAIT:
            case Torrent.STATUS_CHECK:
                str = this.getShortStatusString( rec, tor );
                break;

            case Torrent.STATUS_DOWNLOAD:
            {
                var isMagnet = tor.metadataPercentDone < 1;
                var dnPeers = tor.peersSendingToUs;
                var upPeers = tor.peersGettingFromUs;
                var dnWeb = tor.webseedsSendingToUs;

                if( isMagnet )
                    str = String.format( 'Downloading metadata from {0} ({1}% done)',
                            Ext.util.Format.plural( tor.peersSendingToUs, 'peer', 'peers' ),
                            Transmission.fmt.percentString( 100.0 * tor.metadataPercentComplete ) );
                else
                    str = String.format( 'Downloading from {0} of {1}',
                            dnWeb + tor.peersSendingToUs,
                            Ext.util.Format.plural( dnWeb + tor.peersConnected, 'connected peer' ) );
                break;
            }

            case Torrent.STATUS_SEED:
                str = String.format( 'Seeding to {0} of {1}',
                    tor.peersGettingFromUs,
                    Ext.util.Format.plural( tor.peersConnected, 'connected peer', 'connected peers' ) );
                break;

            default:
                str = "Error";
                break;
        }

        if( rec.isReadyToTransfer( ) ) {
            var s = this.shortTransferString( tor );
            if( s.length > 0 )
                str += ' - ' + s;
        }

        return str;
    },

    generateProgressbarHtml: function( percentDone ) // [0...1]
    {
        var widthPct = Math.floor( 100 * percentDone );
        var doneBg = '#228b22'; // forestgreen
        var doneFg = 'white';
        var remainBg = 'white';
        var remainFg = 'black';

        return ['<div style="text-align:center;  border:1px solid #dddddd; position:relative; width:100%;">',
                    '<div style="width:',widthPct,'%; overflow:hidden; position:absolute; top:0; left:0;">',
                      '<div style="color:',doneFg,'; background-color:',doneBg,'; width:',(widthPct?Math.floor(100*(100.0/widthPct)):0),'%"><span>',widthPct,'%</span></div>',
                    '</div>',
                    '<div style="color:',remainFg,'; background-color:',remainBg,'"><span>',widthPct,'%</span></div>',
                  '</div>' ].join('');
    },

    renderTorrent: function( value, metadata, record, rowIndex, colIndex, store )
    {
        var tor = record.data;
        var icon = this.getIcon( tor );
	var isPaused = record.isPaused( );

        var strings = [];

	if( isPaused )
		strings.push( '<div style="opacity:0.55">' );
	

        if( this.isCompact )
        {
            var shortStatus = this.getShortStatusString( record, tor );
            var percentDone = Math.floor( 100 * record.percentDone( ) ); // [0..100]
            var progressbarHtml = this.generateProgressbarHtml( record.percentDone( ) );

            strings.push( '<img style="float:left; padding-right:10px;" src="', icon, '"/>',
                          '<div style="float:right;">',
                            '<div style="float:right; margin-left:8px; width:40px;">', progressbarHtml, '</div>',
                            '<span style="margin-left:8px; font-size:smaller">', shortStatus, '</span>',
                          '</div>',
                        '<div style="overflow:hidden;">', record.getName(), '</div>' );
        }
        else
        {
            var statusStr = this.getStatusString( record, tor );
            var progressStr = this.getProgressString( record, tor );
            strings.push( '<img style="padding-top: 3px; padding-right: 10px; float:left;" src="',icon,'"/> ',
                          '<b>', tor.name, '</b>',
                          '<br/>',
                          progressStr,
                          '<br/>',
                          statusStr );
        }
	if( isPaused )
		strings.push( '</div>' );

        return strings.join('');
    },

    getSelectionCount: function( )
    {
        return this.getSelectionModel().getCount();
    },

    clearSelections: function( )
    {
        return this.getSelectionModel().clearSelections( false );
    },

    selectRange: function( startRow, endRow )
    {
        return this.getSelectionModel().selectRange( startRow, endRow );
    },

    setCompact: function( compact )
    {
        this.isCompact = compact;
        this.iconSize = this.isCompact ? Transmission.FileIcon.SMALL : Transmission.FileIcon.LARGE;
        this.getView().refresh( false );
    },

    constructor: function( config_in )
    {
        var config = Ext.apply( {}, config_in, {
            frame: false,
            columns: [ { 'id': 'maincol', header: 'Id', dataIndex: 'id', renderer: { fn: this.renderTorrent, scope: this } } ],
            hideHeaders: true,
            hideLabel: true,
            multiSelect: true,
            stripeRows: true,
            autoExpandColumn: 'maincol'
            //autoFill: true
        } );

        TorrentView.superclass.constructor.call( this, config );
//console.log('a');
//console.log('b');
        this.addListener( 'resize', function(){this.getView().refresh(false);}, this );
    }
});

Ext.reg('torrentview', TorrentView);
