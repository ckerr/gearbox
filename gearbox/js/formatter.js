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

Transmission.fmt = (function()
{
    var speed_K = 1024,
        speed_K_str = 'KB/s',
        speed_M_str = 'MB/s',
        speed_G_str = 'GB/s',

        size_K = 1024,
        size_B_str = 'B',
        size_K_str = 'KB',
        size_M_str = 'MB',
        size_G_str = 'GB',
        size_T_str = 'TB',

        mem_K = 1024,
        mem_B_str = 'B',
        mem_K_str = 'KB',
        mem_M_str = 'MB',
        mem_G_str = 'GB',
        mem_T_str = 'TB';

    return {


        /*
         *   Format a percentage to a string
         */
        percentString: function( x ) {
            if( x < 10.0 )
                return x.toTruncFixed( 2 );
            else if( x < 100.0 )
                return x.toTruncFixed( 1 );
            else
                return x.toTruncFixed( 0 );
        },

        /*
         *   Format a ratio to a string
         */
        ratioString: function( x ) {
            if( x ==  -1 )
                return "None";
            else if( x == -2 )
                return '&infin;';
            else
                return this.percentString( x );
        },

        /**
         * Formats the a memory size into a human-readable string
         * @param {Number} bytes the filesize in bytes
         * @return {String} human-readable string
         */
        mem: function( bytes )
        {
            if( bytes < mem_K )
                return [ bytes, mem_B_str ].join(' ');

            var convertedSize,
                unit;

            if( bytes < Math.pow( mem_K, 2 ) )
            {
                convertedSize = bytes / mem_K;
                unit = mem_K_str;
            }
            else if( bytes < Math.pow( mem_K, 3 ) )
            {
                convertedSize = bytes / Math.pow( mem_K, 2 );
                unit = mem_M_str;
            }
            else if( bytes < Math.pow( mem_K, 4 ) )
            {
                convertedSize = bytes / Math.pow( mem_K, 3 );
                unit = mem_G_str;
            }
            else
            {
                convertedSize = bytes / Math.pow( mem_K, 4 );
                unit = mem_T_str;
            }

            // try to have at least 3 digits and at least 1 decimal
            return convertedSize <= 9.995 ? convertedSize.toTruncFixed(2) + ' ' + unit
                                          : convertedSize.toTruncFixed(1) + ' ' + unit;
        },

        /**
         * Formats the a disk capacity or file size into a human-readable string
         * @param {Number} bytes the filesize in bytes
         * @return {String} human-readable string
         */
        size: function( bytes )
        {
            if( !bytes )
                return 'None';

            if( bytes < size_K )
                return [ bytes, size_B_str ].join(' ');

            var convertedSize,
                unit;

            if( bytes < Math.pow( size_K, 2 ) )
            {
                convertedSize = bytes / size_K;
                unit = size_K_str;
            }
            else if( bytes < Math.pow( size_K, 3 ) )
            {
                convertedSize = bytes / Math.pow( size_K, 2 );
                unit = size_M_str;
            }
            else if( bytes < Math.pow( size_K, 4 ) )
            {
                convertedSize = bytes / Math.pow( size_K, 3 );
                unit = size_G_str;
            }
            else
            {
                convertedSize = bytes / Math.pow( size_K, 4 );
                unit = size_T_str;
            }

            // try to have at least 3 digits and at least 1 decimal
            return convertedSize <= 9.995 ? convertedSize.toTruncFixed(2) + ' ' + unit
                                          : convertedSize.toTruncFixed(1) + ' ' + unit;
        },

	speedBps: function( Bps )
	{
		return this.speed( this.toKBps( Bps ) );
	},

	toKBps: function( Bps )
	{
		return Math.floor( Bps / speed_K );
	},

        speed: function( KBps )
        {
            var speed = KBps;

            if (!speed)
                speed = 0;

            if (speed <= 999.95) // 0 KBps to 999.9 K
                return speed.toTruncFixed(1) + ' ' + speed_K_str;

            speed /= speed_K;

            if (speed <= 99.995) // 1 M to 99.99 M
                return speed.toTruncFixed(2) + ' ' + speed_M_str;
            if (speed <= 999.95) // 100 M to 999.9 M
                return speed.toTruncFixed(1) + ' ' + speed_M_str;

            // insane speeds
            speed /= speed_K;
            return speed.toTruncFixed(2) + ' ' + speed_G_str;
        },

        speedUnitStr: speed_K_str,

        timeInterval: function( seconds )
        {
            var result,
                days = Math.floor(seconds / 86400),
                hours = Math.floor((seconds % 86400) / 3600),
                minutes = Math.floor((seconds % 3600) / 60);

            seconds = Math.floor((seconds % 3600) % 60);

            if (days > 0 && hours === 0)
                result = Ext.util.Format.plural(days, 'day');
            else if (days > 0 && hours > 0)
                result = Ext.util.Format.plural(days, 'day') + ', ' + Ext.util.Format.plural(hours, 'hr');
            else if (hours > 0 && minutes === 0)
                result = Ext.util.Format.plural(hours, 'hr');
            else if (hours > 0 && minutes > 0)
                result = Ext.util.Format.plural(hours, 'hr') + ', ' + Ext.util.Format.plural(minutes, 'min');
            else if (minutes > 0 && seconds === 0)
                result = Ext.util.Format.plural(minutes, 'min');
            else if (minutes > 0 && seconds > 0)
                result = Ext.util.Format.plural(minutes, 'min') + ', ' + Ext.util.Format.plural(seconds, 'sec');
            else
                result = Ext.util.Format.plural(seconds, 'sec');

            return result;
        },

        timestamp: function( seconds )
        {
            var myDate = new Date(seconds*1000),
                date,
                time,
                now = new Date(),
                sameYear = now.getFullYear() == myDate.getFullYear(),
                sameMonth = now.getMonth() == myDate.getMonth(),
                dateDiff = now.getDate() - myDate.getDate();

            if(sameYear && sameMonth && Math.abs(dateDiff) <= 1){
                if(dateDiff === 0)
                    date = "Today";
                else if(dateDiff == 1)
                    date = "Yesterday";
                else
                    date = "Tomorrow";
            }
            else{
                date = myDate.toDateString();
            }

            var hours = myDate.getHours(),
                period = "AM";

            if(hours > 12){
                hours = hours - 12;
                period = "PM";
            }
            if(hours === 0){
                hours = 12;
            }
            if(hours < 10){
                hours = "0" + hours;
            }
            var minutes = myDate.getMinutes();
            if(minutes < 10){
                minutes = "0" + minutes;
            }
            var seconds = myDate.getSeconds();
                if(seconds < 10){
                    seconds = "0" + seconds;
            }

            time = [hours, minutes, seconds].join(':');

            return [date, time, period].join(' ');
        }
    };
})();
