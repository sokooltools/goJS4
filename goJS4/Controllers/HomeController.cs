using goJS4.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using Microsoft.AspNetCore.Hosting;
using Controller = Microsoft.AspNetCore.Mvc.Controller;

namespace goJS4.Controllers
{
	public class HomeController : Controller
	{
		[ViewData]
		// ReSharper disable once MemberCanBePrivate.Global
		public string Title { get; set; }
		
		[ViewData]
		// ReSharper disable once MemberCanBePrivate.Global
		public bool IsDevelopment { get; set; }

		private readonly ILogger<HomeController> _logger;

		public HomeController(IWebHostEnvironment env, ILogger<HomeController> logger)
		{
			IsDevelopment = env.EnvironmentName == "Development";
			_logger = logger;
		}

		public IActionResult Index()
		{   
			Title = "goJS4 Home Page";
			_logger.LogInformation("Entered Index route.");
			return View();
		}

		public IActionResult Privacy()
		{
			Title = "Privacy";
			_logger.LogInformation("Entered Privacy route.");
			return View();
		}

		public IActionResult Ivr()
		{
			Title = "IVR Tree";
			//_logger.LogInformation("Entered IVR route.");
			return View();
		}

		public IActionResult SampleShapes()
		{
			Title = "Sample Shapes";
			//_logger.LogInformation("Entered SampleShapes route.");
			return View();
		}

		//public IActionResult Data()
		//{
		//	return JsonResult();
		//}

		[ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
		public IActionResult Error()
		{
			return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
		}
	}
}
