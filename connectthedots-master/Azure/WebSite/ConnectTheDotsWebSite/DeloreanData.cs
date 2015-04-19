using Microsoft.WindowsAzure.Storage.Table;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ConnectTheDotsWebSite
{
    public class DeloreanData : TableEntity
    {
        public DeloreanData(string pKey, string rKey)
        {
            this.PartitionKey = pKey;
            this.RowKey = rKey;
        }

        public DeloreanData() { }

        public string guid { get; set; }
        public string displayname { get; set; }
        public string organization { get; set; }
        public string location { get; set; }
        public string measurename { get; set; }
        public string unitofmeasure { get; set; }
        public string timecreated { get; set; }
        public string value { get; set; }
    }
}