using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PhoneApp1
{
    class TempViewModel : INotifyPropertyChanged
    {
        public static TempViewModel m = new TempViewModel();
        private float temp = 75;
        public float Temperature { get { return temp; } set { temp = value; OnPropertyChanged("StrTemp"); } }

        private int status = 0;
        public int Status { get { return status; } set { status = value; OnPropertyChanged("StrStatus"); } }

        public event PropertyChangedEventHandler PropertyChanged;

        public string StrTemp { get { return temp.ToString("0.0") + " F"; } }

        public string StrStatus { get { return status == 0 ? "OFF" : "ON"; } }
        protected virtual void OnPropertyChanged(string propName)
        {
            PropertyChangedEventHandler eh = this.PropertyChanged;
            if (eh != null)
            {
                eh(this, new PropertyChangedEventArgs(propName));
            }
        }
    }
}
