using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Table;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace ArchosAPI.Controllers
{
    public class DeloreanController : Controller
    {
        private static int status = 0;
        // GET: Delorean
        public ActionResult Index()
        {
            return View();
        }
        public int StartEngine()
        {
            status = 1;
            return status;
        }
        public int StopEngine()
        {
            status = 0;
            return status;
        }
        public int CheckEngineStart()
        {
            return status;
        }
        public float GetCurrentTemperature()
        {
            CloudStorageAccount storageAccount = CloudStorageAccount.Parse("Storage ACcount Key");

            // Create the table client.
            CloudTableClient tableClient = storageAccount.CreateCloudTableClient();

            // Create the CloudTable object that represents the "people" table.
            CloudTable table = tableClient.GetTableReference("table");
            TableQuery<DeloreanData> query = new TableQuery<DeloreanData>().Where(TableQuery.GenerateFilterCondition("PartitionKey", QueryComparisons.Equal, "partition"));
            var rows = table.ExecuteQuery(query).ToList();
            // Create a new customer entity.
            var row = rows.LastOrDefault();
            if (row != null)
                return float.Parse(row.value);
            else
                return -1;
        }
    }
}