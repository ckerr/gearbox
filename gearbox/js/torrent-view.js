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

TorrentView = Ext.extend( Ext.list.ListView,
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
        var seedRatio = rec.getSeedRatio( );
        var hasSeedRatio = seedRatio > 0;
        var str;

        if( isMagnet ) // magnet link with no metadata
        {
            // {0} is the percentage of torrent metadata downloaded
            str = String.format( "Magnetized transfer - retrieving metadata {0}%)",
                                 Transmission.fmt.percentString( tor.metadataPercentDone() * 100.0 ) );
        }
        else if( !isDone ) // downloading
        {
            // {0} is how much we've got,
            // {1} is how much we'll have when done,
            // {2} is a percentage of the two
            str = String.format( "{0} of {1} ({2}%)",
                    Transmission.fmt.size( rec.haveTotal( ) ),
                    Transmission.fmt.size( rec.sizeWhenDone( ) ),
                    Transmission.fmt.percentString( rec.percentDone() * 100.0 ) );
        }
        else if( !isSeed ) // partial seed
        {
            if( hasSeedRatio )
            {
                // {0} is how much we've got,
                // {1} is the torrent's total size,
                // {2} is a percentage of the two,
                // {3} is how much we've uploaded,
                // {4} is our upload-to-download ratio
                // {5} is the ratio we want to reach before we stop uploading
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
                // {0} is how much we've got,
                // {1} is the torrent's total size,
                // {2} is a percentage of the two,
                // {3} is how much we've uploaded,
                // {4} is our upload-to-download ratio
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
                // {0} is the torrent's total size,
                // {1} is how much we've uploaded,
                // {2} is our upload-to-download ratio,
                // {3} is the ratio we want to reach before we stop uploading
                str = String.format( "{0}, uploaded {1} (Ratio: {2} Goal: {3})",
                        Transmission.fmt.size( rec.haveTotal( ) ),
                        Transmission.fmt.size( rec.uploadedEver( ) ),
                        Transmission.fmt.ratioString( rec.uploadRatio( ) ),
                        Transmission.fmt.ratioString( seedRatio ) );
            }
            else // seeding w/o a ratio
            {
                // {0} is the torrent's total size,
                // {1} is how much we've uploaded,
                // {2} is our upload-to-download ratio
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
            downStr = Transmission.fmt.speedBps( tor.rateDownload );
        if( haveUp )
            upStr = Transmission.fmt.speedBps( tor.rateUpload );

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

    getShortStatusString: function( record, tor )
    {
        var s = '';

        switch( tor.status )
        {
            case Torrent.STATUS_CHECK:
                s = String.format( 'Verifying local data ({0}% tested)', Transmission.fmt.percentString( tor.recheckProgress * 100.0 ) );
                break;

            case Torrent.STATUS_DOWNLOAD:
            case Torrent.STATUS_SEED:
                if( !record.isDownloading() )
                    s = String.format( 'Ratio: {0}, ', Transmission.fmt.ratioString( record.uploadRatio() ) );
                s += this.shortTransferString( tor );
                break;

            default:
                s = record.getActivityString( );
                break;
        }

        return s;
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
                str = [ str, '-', s ].join(' ');
        }

        return str;
    },

    generateProgressbarHtml: function( percentDone/*[0..1]*/, compact, record )
    {
        var tor = record.data;
        var pct = Math.floor( 100 * percentDone );
        var pctStr = compact ? [ pct, '%' ].join('') : '';
        var cls = 'torrent_progress_bar ';
        var text = [];

        switch( record.activity( ) )
        {
            case Torrent.STATUS_CHECK:
            case Torrent.STATUS_DOWNLOAD:
                cls += record.isMagnet() ? 'magnet' : 'download';
                break;
            case Torrent.STATUS_SEED:
                cls += 'seed';
                if( pctStr ) pctStr = '100%';
                break;
            default:
                cls += 'stopped';
                break;
       }

        if( !pctStr ) pctStr = '&nbsp;';

        if( pct == 100 )
        {
            text.push( '<div class="',cls,'" style="text-align:center; border:1px solid #ddd; position:relative; ' );

            if( compact )
                text.push( 'width:40px;float:right; margin-left:8px;">' );
            else
                text.push( 'width:100%;">' );

            text.push( pctStr, '</div>' );
        }
        else
        {
            text.push( '<div style="text-align:center; border:1px solid #ddd; position:relative; ' );

            if( compact )
                text.push( 'width:40px;float:right; margin-left:8px;">' );
            else
                text.push( 'width:100%;">' );

            text.push( '<div style="width:',pct,'%; overflow:hidden; position:absolute; top:0; left:0;">',
                         '<div class="',cls,'"; style="width:',(pct?Math.floor(100*(100.0/pct)):0),'%">',pctStr,'</div>',
                       '</div>',
                       '<div class="',cls,' remain">',pctStr,'</div>',
                       '</div>' );
        }

        return text.join('');
    },

    renderTorrent: function( record )
    {
        var tor = record.data;
        var icon = this.getIcon( tor );
        var isPaused = record.isPaused( );
        var strings = [];
        var percentDone;
        var opacity = isPaused ? '0.55' : '1';

        if( !record.isSeeding( ) )
            percentDone = record.isMagnet( ) ? tor.metadataPercentComplete : record.percentDone( );
        else {
            var seedRatio = record.getSeedRatio( );
            percentDone = seedRatio > 0 ? Math.min( record.uploadRatio( ) / seedRatio, 1 ) : 1;
        }

        var progressbarHtml = this.generateProgressbarHtml( percentDone, this.isCompact, record );

        if( this.isCompact )
        {
            var shortStatus = this.getShortStatusString( record, tor );


            strings.push( '<img style="opacity:',opacity,';float:left; padding-right:10px; width:', this.iconSize, 'px; height:', this.iconSize, 'px;" src="', icon, '"/>',
                          '<div style="opacity:',opacity,';float:right;">',
                            progressbarHtml,
                            '<span style="margin-left:8px; font-size:smaller">', shortStatus, '</span>',
                          '</div>',
                          '<div style="opacity:',opacity,';overflow:hidden;">', record.getName(), '</div>' );
        }
        else
        {
            var statusStr = this.getStatusString( record, tor );
            var progressStr = this.getProgressString( record, tor );

            strings.push( '<div style="opacity:',opacity,';display:table-cell; vertical-align:middle;"><img style="width:',this.iconSize,'px; height:',this.iconSize,'px;" src="',icon,'"/>&nbsp;</div>',
                          '<div style="opacity:',opacity,';display:table-cell; padding-left:8px; width:100%">',
                            '<b>',record.getName(),'</b>','<br>',
                            progressStr,'<br>',
                            progressbarHtml,
                            statusStr,
                          '</div>' );
        }

        return strings.join('');
    },

    setCompact: function( compact )
    {
        this.isCompact = compact;
        this.iconSize = this.isCompact ? Transmission.FileIcon.SMALL : Transmission.FileIcon.LARGE;
        this.refresh();
    },

    refresh: function() {
        var selected = this.getSelectedRecords();
        this.superclass().refresh.call(this);
        this.select( selected );
    },

    constructor: function( config_in )
    {
        var me = this;
        var tpl = new Ext.XTemplate( '{id:this.format}', {format:function(id){ return me.renderTorrent( Torrent.store.getById(id) ); } } );
        var config = Ext.apply( {}, config_in, {
            columns: [ { 'id': 'maincol', dataIndex: 'id', tpl:tpl, width:1 } ],
            hideHeaders: true,
            hideLabel: true,
            maxColumnWidth: 10000,
            multiSelect: true
        } );

        this.superclass().constructor.call(this, config);
        this.addListener( 'resize', function(){this.refresh();}, this );
    }
});

Ext.reg('torrentview', TorrentView);
