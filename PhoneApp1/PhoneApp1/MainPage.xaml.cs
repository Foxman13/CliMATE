using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Navigation;
using Microsoft.Phone.Controls;
using Microsoft.Phone.Shell;
using PhoneApp1.Resources;
using System.Windows.Threading;

namespace PhoneApp1
{
    public partial class MainPage : PhoneApplicationPage
    {
        // Constructor
        private DispatcherTimer timer;

        public MainPage()
        {
            InitializeComponent();

            // Sample code to localize the ApplicationBar
            //BuildLocalizedApplicationBar();
            timer = new DispatcherTimer() { Interval = new TimeSpan(0, 0, 1) };
            timer.Tick += timer_Tick;
            timer.Start();

            TempTextBlock.DataContext = TempViewModel.m;
            StatusTextBlock.DataContext = TempViewModel.m;

        }
      

         void timer_Tick(object sender, EventArgs e)
        {
            WebClient c = new WebClient();
            WebClient c2 = new WebClient();



            c.DownloadStringCompleted += c_DownloadStringCompleted;


            c2.DownloadStringCompleted += c2_DownloadStringCompleted;
            
            c.DownloadStringAsync(new Uri("http://archos.azurewebsites.net/delorean/GetCurrentTemperature"));

            c2.DownloadStringAsync(new Uri("http://archos.azurewebsites.net/delorean/CheckEngineStart"));
           
        }

        void c_DownloadStringCompleted(object sender, DownloadStringCompletedEventArgs e)
        {
            float temp;
            string t = e.Result;
            float.TryParse( t, out temp);
            TempViewModel.m.Temperature = temp; 
        }

        void c2_DownloadStringCompleted(object sender, DownloadStringCompletedEventArgs e)
        {
            int x;
            string t = e.Result;
            int.TryParse(t, out x);
            TempViewModel.m.Status = x;
        }

        private void Button_Click(object sender, RoutedEventArgs e)
        {
            WebClient c = new WebClient();
            c.DownloadStringAsync(new Uri("http://archos.azurewebsites.net/delorean/StartEngine"));
            timer_Tick(null, null);
        }

        private void Button_Click_1(object sender, RoutedEventArgs e)
        {
            WebClient c = new WebClient();
            c.DownloadStringAsync(new Uri("http://archos.azurewebsites.net/delorean/StopEngine"));
            timer_Tick(null, null);
        }


        // Sample code for building a localized ApplicationBar
        //private void BuildLocalizedApplicationBar()
        //{
        //    // Set the page's ApplicationBar to a new instance of ApplicationBar.
        //    ApplicationBar = new ApplicationBar();

        //    // Create a new button and set the text value to the localized string from AppResources.
        //    ApplicationBarIconButton appBarButton = new ApplicationBarIconButton(new Uri("/Assets/AppBar/appbar.add.rest.png", UriKind.Relative));
        //    appBarButton.Text = AppResources.AppBarButtonText;
        //    ApplicationBar.Buttons.Add(appBarButton);

        //    // Create a new menu item with the localized string from AppResources.
        //    ApplicationBarMenuItem appBarMenuItem = new ApplicationBarMenuItem(AppResources.AppBarMenuItemText);
        //    ApplicationBar.MenuItems.Add(appBarMenuItem);
        //}
    }
}